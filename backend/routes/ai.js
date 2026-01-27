const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const University = require('../models/University');
const Task = require('../models/Task');
const ChatHistory = require('../models/ChatHistory');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Process user actions (shortlist, lock, create tasks)
async function processUserActions(message, user, universities) {
  const lowerMessage = message.toLowerCase();
  const actions = [];
  let actionResponse = null;
  const firstName = user.fullName?.split(' ')[0] || 'there';
  
  // Detect shortlist intent
  if (lowerMessage.includes('shortlist') || lowerMessage.includes('add to my list') || lowerMessage.includes('save university')) {
    // Try to find university name in message
    const uni = findUniversityInMessage(message, universities);
    
    if (uni && uni._id) {
      // Determine category
      let category = 'target';
      if (lowerMessage.includes('dream')) category = 'dream';
      else if (lowerMessage.includes('safe')) category = 'safe';
      else if (lowerMessage.includes('target')) category = 'target';
      
      // Check if already shortlisted
      const alreadyShortlisted = user.shortlistedUniversities.find(
        s => s.universityId && uni._id && s.universityId.toString() === uni._id.toString()
      );
      
      if (alreadyShortlisted) {
        actionResponse = `**${uni.name}** is already on your shortlist as a **${alreadyShortlisted.category}** school! 

Would you like me to change its category, or would you like to explore other universities?`;
      } else {
        // Add to shortlist
        user.shortlistedUniversities.push({ 
          universityId: uni._id, 
          category: category,
          addedAt: new Date()
        });
        await user.save();
        
        actions.push({ type: 'shortlist', universityName: uni.name, category });
        
        actionResponse = `Done! I've added **${uni.name}** to your shortlist as a **${category.toUpperCase()}** school! 🎉

**Why ${uni.name} is a good ${category} choice for you:**
${getUniversityFitExplanation(uni, user, category)}

**Your shortlist now has ${user.shortlistedUniversities.length} universities.**

${user.shortlistedUniversities.length >= 3 && user.lockedUniversities.length === 0 
  ? `\n**Next step:** You have enough universities shortlisted. Would you like to **lock** one to start your application planning? Just say "lock ${uni.name}" or name another university.` 
  : `\nWould you like me to recommend more universities, or tell you about another school?`}`;
      }
    } else if (uni && !uni._id) {
      // University recognized but not in database
      actionResponse = `I recognize **${uni.name}** - that's an excellent choice! 

However, I don't have this university in my database yet. Here's what you can do:

1. Go to the **Universities** tab and search for it
2. Or ask me to recommend similar universities in that region

**In the meantime, here are some great alternatives:**
${getTopRecommendations(user, universities, 3).map((u, i) => `${i + 1}. **${u.name}** (${u.country})`).join('\n')}

Would you like me to shortlist any of these instead?`;
    } else {
      // No university found, suggest some
      const recommendations = getTopRecommendations(user, universities, 3);
      actionResponse = `I'd be happy to shortlist a university for you! Which one would you like to add?

**Here are my top recommendations for you:**
${recommendations.map((u, i) => `${i + 1}. **${u.name}** (${u.country}) - ${u.ranking ? `Ranked #${u.ranking}` : 'Excellent program'}`).join('\n')}

Just say something like **"Shortlist ${recommendations[0]?.name || 'MIT'} as a target"** and I'll add it to your list!`;
    }
  }
  
  // Detect lock intent
  else if (lowerMessage.includes('lock') || lowerMessage.includes('finalize') || lowerMessage.includes('commit to')) {
    console.log('Lock intent detected. Message:', message);
    console.log('Universities in DB:', universities.length);
    const uni = findUniversityInMessage(message, universities);
    console.log('Found university:', uni ? uni.name : 'None', 'ID:', uni?._id);
    
    if (uni && uni._id) {
      // Check if shortlisted first
      const shortlisted = user.shortlistedUniversities.find(
        s => s.universityId && uni._id && s.universityId.toString() === uni._id.toString()
      );
      
      const alreadyLocked = user.lockedUniversities.find(
        l => l.universityId && uni._id && l.universityId.toString() === uni._id.toString()
      );
      
      if (alreadyLocked) {
        actionResponse = `**${uni.name}** is already locked! ✅

You're committed to applying here. Check the **Application Guide** tab for your personalized task list and deadlines for this university.

Is there another university you'd like to lock?`;
      } else {
        // Lock the university
        user.lockedUniversities.push({ 
          universityId: uni._id, 
          lockedAt: new Date() 
        });
        
        // Also add to shortlist if not already
        if (!shortlisted) {
          user.shortlistedUniversities.push({ 
            universityId: uni._id, 
            category: 'target',
            addedAt: new Date()
          });
        }
        
        // Update stage
        if (user.currentStage < 3) {
          user.currentStage = 3;
        }
        if (user.lockedUniversities.length >= 3) {
          user.currentStage = 4;
        }
        
        await user.save();
        
        actions.push({ type: 'lock', universityName: uni.name });
        
        // Create default tasks for this university
        await createApplicationTasks(user._id, uni);
        
        actionResponse = `🔒 **${uni.name} is now locked!** You're committed to applying here.

I've created a personalized application checklist for you:

**📋 Tasks I've Added:**
• Research ${uni.name}'s specific requirements
• Prepare Statement of Purpose for ${uni.name}
• Gather Letters of Recommendation
• Prepare financial documents
• Complete application form

**📅 Key Info:**
• Country: ${uni.country}
• Application typically due: ${getTypicalDeadline(uni)}
• Estimated cost: $${uni.tuitionFee?.toLocaleString() || '30,000-50,000'}/year

**You now have ${user.lockedUniversities.length} locked university(ies).**

Head to the **Application Guide** tab to see your complete task list, or lock more universities to add to your application pool!`;
      }
    } else if (user.shortlistedUniversities.length > 0) {
      // No university specified, show shortlisted options
      const shortlistedUnis = await University.find({
        _id: { $in: user.shortlistedUniversities.map(s => s.universityId) }
      });
      
      actionResponse = `Which university would you like to lock? Here's your current shortlist:

${shortlistedUnis.map((u, i) => {
  const category = user.shortlistedUniversities.find(s => s.universityId.toString() === u._id.toString())?.category;
  return `${i + 1}. **${u.name}** (${category?.toUpperCase() || 'Target'})`;
}).join('\n')}

Just say **"Lock [university name]"** to commit to applying there!`;
    } else {
      actionResponse = `You need to shortlist some universities before you can lock them!

Would you like me to recommend universities for your profile? Just say **"recommend universities"** and I'll give you personalized suggestions.`;
    }
  }
  
  // Detect task creation intent
  else if (lowerMessage.includes('create task') || lowerMessage.includes('add task') || lowerMessage.includes('remind me') || lowerMessage.includes('todo') || lowerMessage.includes('to-do')) {
    // Extract task from message
    const taskMatch = message.match(/(?:create task|add task|remind me to|todo:|to-do:?)\s*[:\-]?\s*(.+)/i);
    
    if (taskMatch && taskMatch[1]) {
      const taskTitle = taskMatch[1].trim();
      const priority = lowerMessage.includes('urgent') || lowerMessage.includes('important') ? 'high' : 'medium';
      
      await Task.create({
        userId: user._id,
        title: taskTitle,
        priority: priority,
        aiGenerated: true,
        createdAt: new Date()
      });
      
      actions.push({ type: 'create_task', title: taskTitle, priority });
      
      actionResponse = `✅ **Task created:** "${taskTitle}"

Priority: **${priority.charAt(0).toUpperCase() + priority.slice(1)}**

I've added this to your task list. You can view all your tasks in the **Application Guide** tab.

Would you like me to:
• Create more tasks?
• Show you what else you should be working on?
• Help with your application strategy?`;
    } else {
      // Suggest tasks based on profile
      const suggestedTasks = getSuggestedTasks(user);
      
      actionResponse = `I'd be happy to create a task for you! What would you like to add?

**Based on your profile, here are some tasks I recommend:**
${suggestedTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Just say **"Create task: [your task]"** or ask me to add any of the above!`;
    }
  }
  
  // Detect "add task" for specific suggested tasks
  else if (lowerMessage.includes('add') && (lowerMessage.includes('ielts') || lowerMessage.includes('toefl') || lowerMessage.includes('gre') || lowerMessage.includes('sop') || lowerMessage.includes('lor') || lowerMessage.includes('recommendation'))) {
    let taskTitle = '';
    let priority = 'high';
    
    if (lowerMessage.includes('ielts')) taskTitle = 'Register for IELTS exam';
    else if (lowerMessage.includes('toefl')) taskTitle = 'Register for TOEFL exam';
    else if (lowerMessage.includes('gre')) taskTitle = 'Register for GRE exam';
    else if (lowerMessage.includes('sop')) taskTitle = 'Draft Statement of Purpose';
    else if (lowerMessage.includes('lor') || lowerMessage.includes('recommendation')) taskTitle = 'Request Letters of Recommendation';
    
    if (taskTitle) {
      await Task.create({
        userId: user._id,
        title: taskTitle,
        priority: priority,
        aiGenerated: true,
        createdAt: new Date()
      });
      
      actions.push({ type: 'create_task', title: taskTitle, priority });
      
      actionResponse = `✅ **Task added:** "${taskTitle}"

This is marked as **high priority** since it's crucial for your applications.

**Quick tips for ${taskTitle.toLowerCase().includes('ielts') || taskTitle.toLowerCase().includes('toefl') ? 'English tests' : taskTitle.toLowerCase().includes('gre') ? 'GRE' : taskTitle.toLowerCase().includes('sop') ? 'your SOP' : 'LORs'}:**
${getTaskTips(taskTitle)}

What else can I help you with?`;
    }
  }
  
  return { actions, actionResponse };
}

// Helper: Find university in message
function findUniversityInMessage(message, universities) {
  const lowerMessage = message.toLowerCase();
  
  // Try exact match first
  for (const uni of universities) {
    if (lowerMessage.includes(uni.name.toLowerCase())) {
      return uni;
    }
  }
  
  // Try partial match
  const commonNames = {
    'mit': 'Massachusetts Institute of Technology',
    'stanford': 'Stanford University',
    'harvard': 'Harvard University',
    'cmu': 'Carnegie Mellon University',
    'carnegie': 'Carnegie Mellon University',
    'berkeley': 'UC Berkeley',
    'ucb': 'UC Berkeley',
    'ucla': 'UCLA',
    'usc': 'University of Southern California',
    'nyu': 'New York University',
    'columbia': 'Columbia University',
    'yale': 'Yale University',
    'princeton': 'Princeton University',
    'cornell': 'Cornell University',
    'upenn': 'University of Pennsylvania',
    'penn': 'University of Pennsylvania',
    'michigan': 'University of Michigan',
    'georgia tech': 'Georgia Institute of Technology',
    'gatech': 'Georgia Institute of Technology',
    'ut austin': 'University of Texas at Austin',
    'texas': 'University of Texas at Austin',
    'waterloo': 'University of Waterloo',
    'toronto': 'University of Toronto',
    'ubc': 'University of British Columbia',
    'mcgill': 'McGill University',
    'oxford': 'University of Oxford',
    'cambridge': 'University of Cambridge',
    'imperial': 'Imperial College London',
    'ucl': 'University College London',
    'edinburgh': 'University of Edinburgh',
    'manchester': 'University of Manchester',
    'tu munich': 'Technical University of Munich',
    'tum': 'Technical University of Munich',
    'eth': 'ETH Zurich',
    'nus': 'National University of Singapore',
    'ntu': 'Nanyang Technological University',
    'melbourne': 'University of Melbourne',
    'sydney': 'University of Sydney',
    'asu': 'Arizona State University',
    'northeastern': 'Northeastern University'
  };
  
  for (const [abbrev, fullName] of Object.entries(commonNames)) {
    if (lowerMessage.includes(abbrev)) {
      const found = universities.find(u => u.name.toLowerCase().includes(fullName.toLowerCase()) || u.name.toLowerCase().includes(abbrev));
      if (found) return found;
      
      // Return a mock university object if not in database
      return { 
        _id: null, 
        name: fullName, 
        country: 'USA',
        ranking: null,
        tuitionFee: 50000
      };
    }
  }
  
  return null;
}

// Helper: Get university fit explanation
function getUniversityFitExplanation(uni, user, category) {
  const field = user.fieldOfStudy || 'your field';
  
  if (category === 'dream') {
    return `• World-renowned ${field} program with cutting-edge research
• Highly competitive admissions (you'll need a strong application!)
• Excellent career outcomes and alumni network
• Worth the reach – acceptance here would be transformative`;
  } else if (category === 'safe') {
    return `• Strong ${field} program with good acceptance rates
• Your profile aligns well with their typical admits
• Good funding opportunities for international students
• Solid choice to ensure you have options`;
  } else {
    return `• Excellent ${field} program matching your interests
• Your GPA and profile are competitive for this school
• Good balance of prestige and realistic admission chances
• Strong return on investment`;
  }
}

// Helper: Get top recommendations
function getTopRecommendations(user, universities, count) {
  // Filter by user's preferred countries
  let filtered = universities;
  if (user.preferredCountries?.length > 0) {
    filtered = universities.filter(u => user.preferredCountries.includes(u.country));
  }
  
  // Sort by ranking and return top N
  return filtered
    .sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
    .slice(0, count);
}

// Helper: Create application tasks for locked university
async function createApplicationTasks(userId, university) {
  const tasks = [
    { title: `Research ${university.name}'s admission requirements`, priority: 'high' },
    { title: `Prepare SOP for ${university.name}`, priority: 'high' },
    { title: `Check ${university.name}'s application deadline`, priority: 'high' },
    { title: `Gather financial documents for ${university.name}`, priority: 'medium' },
    { title: `Complete ${university.name} application form`, priority: 'medium' }
  ];
  
  for (const task of tasks) {
    await Task.create({
      userId: userId,
      title: task.title,
      priority: task.priority,
      aiGenerated: true,
      universityId: university._id,
      createdAt: new Date()
    });
  }
}

// Helper: Get typical deadline
function getTypicalDeadline(university) {
  const country = university.country?.toLowerCase();
  if (country === 'usa') return 'December - February (Fall intake)';
  if (country === 'uk') return 'January - March (Fall intake)';
  if (country === 'canada') return 'January - April (Fall intake)';
  if (country === 'germany') return 'July (Winter) / January (Summer)';
  if (country === 'australia') return 'November - February (Feb intake)';
  return 'Check university website for specific dates';
}

// Helper: Get suggested tasks based on profile
function getSuggestedTasks(user) {
  const tasks = [];
  
  if (user.ieltsStatus === 'not-started') {
    tasks.push('Register for IELTS/TOEFL exam');
  }
  if (user.greStatus === 'not-started' && user.intendedDegree === 'masters') {
    tasks.push('Register for GRE exam');
  }
  if (user.sopStatus === 'not-started') {
    tasks.push('Start drafting Statement of Purpose');
  }
  if (user.sopStatus === 'draft') {
    tasks.push('Finalize Statement of Purpose');
  }
  
  tasks.push('Request Letters of Recommendation');
  tasks.push('Gather financial documents');
  tasks.push('Order official transcripts');
  
  return tasks.slice(0, 5);
}

// Helper: Get task tips
function getTaskTips(taskTitle) {
  if (taskTitle.toLowerCase().includes('ielts') || taskTitle.toLowerCase().includes('toefl')) {
    return `• Book your test at least 2 months before application deadlines
• Scores are valid for 2 years
• Most universities need 6.5+ IELTS or 90+ TOEFL`;
  }
  if (taskTitle.toLowerCase().includes('gre')) {
    return `• Focus on Quant if applying for STEM programs
• Many programs now have GRE-optional policies
• Book 1-2 months in advance for preferred dates`;
  }
  if (taskTitle.toLowerCase().includes('sop')) {
    return `• Start with an outline, not the final draft
• Each university's SOP should be customized
• Get feedback from professors or professionals`;
  }
  if (taskTitle.toLowerCase().includes('recommendation')) {
    return `• Ask professors who know your work well
• Give them at least 3-4 weeks notice
• Provide them with your resume and goals`;
  }
  return `• Break this down into smaller steps
• Set a deadline for yourself
• Track progress in the Application Guide`;
}

// Helper to build system context
async function buildSystemContext(user, universities) {
  const shortlistedUnis = await University.find({
    _id: { $in: user.shortlistedUniversities.map(s => s.universityId) }
  });
  
  const lockedUnis = await University.find({
    _id: { $in: user.lockedUniversities.map(l => l.universityId) }
  });
  
  const tasks = await Task.find({ userId: user._id, completed: false });
  
  return `You are an AI Study Abroad Counsellor. You help students make informed decisions about studying abroad.

CURRENT USER PROFILE:
- Name: ${user.fullName}
- Education: ${user.educationLevel} in ${user.major || 'Not specified'}
- Degree: ${user.degree}
- GPA: ${user.gpa || 'Not provided'}
- Graduation Year: ${user.graduationYear}
- Target Degree: ${user.intendedDegree}
- Field of Study: ${user.fieldOfStudy}
- Target Intake: ${user.targetIntakeYear}
- Preferred Countries: ${user.preferredCountries?.join(', ') || 'Not specified'}
- Budget: $${user.budgetMin || 0} - $${user.budgetMax || 0} per year
- Funding Plan: ${user.fundingPlan}
- IELTS: ${user.ieltsStatus} ${user.ieltsScore ? `(Score: ${user.ieltsScore})` : ''}
- TOEFL: ${user.toeflStatus} ${user.toeflScore ? `(Score: ${user.toeflScore})` : ''}
- GRE: ${user.greStatus} ${user.greScore ? `(Score: ${user.greScore})` : ''}
- GMAT: ${user.gmatStatus} ${user.gmatScore ? `(Score: ${user.gmatScore})` : ''}
- SOP Status: ${user.sopStatus}
- Current Stage: ${user.currentStage} (1=Profile Building, 2=Discovering Universities, 3=Finalizing, 4=Application Prep)

SHORTLISTED UNIVERSITIES:
${shortlistedUnis.map(u => `- ${u.name} (${u.country})`).join('\n') || 'None yet'}

LOCKED UNIVERSITIES:
${lockedUnis.map(u => `- ${u.name} (${u.country})`).join('\n') || 'None yet'}

PENDING TASKS:
${tasks.map(t => `- ${t.title} (${t.priority} priority)`).join('\n') || 'No pending tasks'}

AVAILABLE UNIVERSITIES IN DATABASE:
${universities.slice(0, 10).map(u => `- ${u.name} (${u.country}, Ranking: ${u.ranking}, Acceptance: ${u.acceptanceRate}%)`).join('\n')}

YOUR CAPABILITIES:
1. Analyze profile strengths and gaps
2. Recommend universities (Dream/Target/Safe categories)
3. Explain why universities fit or have risks
4. Suggest actions like shortlisting, locking universities
5. Create and suggest to-do tasks
6. Guide through each stage of the journey

IMPORTANT: You must guide decisions, not just answer questions. Be proactive in recommending next steps.

When recommending actions, format them as:
[ACTION: SHORTLIST university_name category]
[ACTION: LOCK university_name]
[ACTION: CREATE_TASK task_title priority]

These will be parsed and executed by the system.`;
}

// Chat with AI Counsellor
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(req.userId);
    const universities = await University.find({});
    
    if (!user.onboardingCompleted) {
      return res.status(403).json({ 
        message: 'Please complete onboarding first',
        requiresOnboarding: true 
      });
    }

    // Process actions from user message (works for both API and fallback mode)
    const { actions, actionResponse } = await processUserActions(message, user, universities);
    
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      // Enhanced fallback response with action handling
      let fallbackReply;
      
      if (actionResponse) {
        // If an action was taken, use the action response
        fallbackReply = actionResponse;
      } else {
        // Otherwise get contextual response
        fallbackReply = await getFallbackResponse(message, user, universities);
      }
      
      return res.json({
        response: fallbackReply,
        actions: actions,
        updatedProfile: {
          shortlistedUniversities: user.shortlistedUniversities,
          lockedUniversities: user.lockedUniversities,
          currentStage: user.currentStage
        }
      });
    }
    
    // universities already fetched above
    const systemContext = await buildSystemContext(user, universities);
    
    // Get or create chat history
    let chatHistory = await ChatHistory.findOne({ userId: req.userId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId: req.userId, messages: [] });
    }
    
    // Build conversation history for context
    const recentMessages = chatHistory.messages.slice(-10);
    const conversationHistory = recentMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-1.5-flash (latest model)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create chat
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'I understand. I am your AI Study Abroad Counsellor. I have access to your profile and will help guide your journey. How can I help you today?' }] },
        ...conversationHistory
      ]
    });
    
    // Send message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const aiResponse = response.text();
    
    // Parse actions from AI response
    const aiActions = [];
    const actionRegex = /\[ACTION: (SHORTLIST|LOCK|CREATE_TASK) ([^\]]+)\]/g;
    let match;
    
    while ((match = actionRegex.exec(aiResponse)) !== null) {
      const actionType = match[1];
      const actionData = match[2].trim();
      
      if (actionType === 'SHORTLIST') {
        const parts = actionData.split(' ');
        const category = parts.pop();
        const universityName = parts.join(' ');
        aiActions.push({ type: 'shortlist', universityName, category });
      } else if (actionType === 'LOCK') {
        aiActions.push({ type: 'lock', universityName: actionData });
      } else if (actionType === 'CREATE_TASK') {
        const parts = actionData.split(' ');
        const priority = parts.pop();
        const title = parts.join(' ');
        aiActions.push({ type: 'create_task', title, priority });
      }
    }
    
    // Execute actions from AI
    for (const action of aiActions) {
      if (action.type === 'shortlist') {
        const uni = await University.findOne({ name: new RegExp(action.universityName, 'i') });
        if (uni && !user.shortlistedUniversities.find(s => s.universityId.toString() === uni._id.toString())) {
          user.shortlistedUniversities.push({ universityId: uni._id, category: action.category });
        }
      } else if (action.type === 'lock') {
        const uni = await University.findOne({ name: new RegExp(action.universityName, 'i') });
        if (uni && !user.lockedUniversities.find(l => l.universityId.toString() === uni._id.toString())) {
          user.lockedUniversities.push({ universityId: uni._id });
          user.currentStage = 4;
        }
      } else if (action.type === 'create_task') {
        await Task.create({
          userId: user._id,
          title: action.title,
          priority: action.priority || 'medium',
          aiGenerated: true
        });
      }
    }
    
    await user.save();
    
    // Combine actions from user intent and AI response
    const allActions = [...actions, ...aiActions];
    
    // Save to chat history
    chatHistory.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse, actions: allActions }
    );
    await chatHistory.save();
    
    // Clean response for display (remove action tags)
    const cleanResponse = aiResponse.replace(/\[ACTION: [^\]]+\]/g, '').trim();
    
    res.json({
      response: cleanResponse,
      actions: allActions,
      updatedProfile: {
        shortlistedUniversities: user.shortlistedUniversities,
        lockedUniversities: user.lockedUniversities,
        currentStage: user.currentStage
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Return fallback response on error
    const user = await User.findById(req.userId);
    const fallbackReply = await getFallbackResponse(req.body.message, user);
    res.json({
      response: fallbackReply,
      actions: [],
      updatedProfile: {
        shortlistedUniversities: user?.shortlistedUniversities || [],
        lockedUniversities: user?.lockedUniversities || [],
        currentStage: user?.currentStage || 1
      }
    });
  }
});

// Enhanced fallback responses - more natural and proactive
async function getFallbackResponse(message, user, universities = []) {
  const lowerMessage = message.toLowerCase();
  const firstName = user.fullName?.split(' ')[0] || 'there';
  
  // Get user's shortlisted and locked universities for context
  const shortlistedCount = user.shortlistedUniversities?.length || 0;
  const lockedCount = user.lockedUniversities?.length || 0;
  
  // Analyze profile strength
  const profileStrengths = [];
  const profileGaps = [];
  
  if (user.gpa && parseFloat(user.gpa) >= 3.5) profileStrengths.push(`strong GPA of ${user.gpa}`);
  else if (user.gpa) profileStrengths.push(`GPA of ${user.gpa}`);
  else profileGaps.push('GPA not provided');
  
  if (user.ieltsStatus === 'completed') profileStrengths.push('IELTS completed');
  else if (user.ieltsStatus === 'in-progress') profileStrengths.push('IELTS in progress');
  else profileGaps.push('English proficiency test not started');
  
  if (user.greStatus === 'completed') profileStrengths.push('GRE completed');
  else if (user.intendedDegree === 'masters' && user.greStatus !== 'not-required') profileGaps.push('GRE not completed');
  
  if (user.sopStatus === 'ready') profileStrengths.push('SOP ready');
  else if (user.sopStatus === 'draft') profileStrengths.push('SOP in draft');
  else profileGaps.push('SOP not started');
  
  // Greeting and introduction
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || message.length < 10) {
    const greeting = getTimeBasedGreeting();
    
    if (user.currentStage <= 2 && shortlistedCount === 0) {
      return `${greeting}, ${firstName}! Great to see you here. I've been looking at your profile and I think we should talk about your university options.

You're aiming for a **${user.intendedDegree}** in **${user.fieldOfStudy}** – that's a solid choice with excellent career prospects. Your preferred countries are ${user.preferredCountries?.join(', ') || 'not yet set'}.

${profileGaps.length > 0 ? `I noticed a few things we should address: ${profileGaps.slice(0, 2).join(' and ')}. But don't worry – we'll work through these together.` : 'Your profile is looking strong!'}

**Here's what I suggest we do right now:**
I can analyze your complete profile and show you exactly which universities would be a great fit – categorized as Dream, Target, and Safe schools. This will give you a clear picture of where you stand.

Just say **"analyze my profile"** or **"recommend universities"** and I'll get started!`;
    }
    
    if (shortlistedCount > 0 && lockedCount === 0) {
      return `${greeting}, ${firstName}! You've been making good progress – I see you have **${shortlistedCount} universities** shortlisted.

The next important step is to **lock in at least one university**. This tells me you're serious about that school, and I'll create a personalized application checklist with deadlines and tasks.

Would you like me to help you decide which university to lock? I can explain the pros and cons of each option on your shortlist.`;
    }
    
    if (lockedCount > 0) {
      return `${greeting}, ${firstName}! You're in the application preparation phase now – this is where things get exciting!

You have **${lockedCount} locked university(ies)**, which means I've prepared specific tasks for your applications. 

**Quick status check:**
• SOP: ${user.sopStatus === 'ready' ? '✅ Ready' : user.sopStatus === 'draft' ? '📝 In draft' : '⚠️ Not started'}
• English Test: ${user.ieltsStatus === 'completed' ? '✅ Done' : user.ieltsStatus === 'in-progress' ? '📝 In progress' : '⚠️ Pending'}

Head over to the **Application Guide** tab to see your complete task list, or ask me about specific deadlines and requirements!`;
    }
    
    return `${greeting}, ${firstName}! I'm your AI Study Abroad Counsellor, and I'm here to guide you through every step of your journey to study abroad.

I've reviewed your profile, and I have some thoughts I'd like to share. What would you like to focus on today?

• **"Analyze my profile"** – I'll break down your strengths and what we need to work on
• **"Recommend universities"** – Get personalized Dream, Target, and Safe options
• **"What should I do next?"** – Clear action items based on your current stage`;
  }
  
  // Profile Analysis
  if (lowerMessage.includes('analyze') || lowerMessage.includes('profile') || lowerMessage.includes('strength') || lowerMessage.includes('gap')) {
    return `Alright ${firstName}, let me give you an honest assessment of where you stand.

**📊 Your Profile Overview:**
You're pursuing a **${user.intendedDegree}** in **${user.fieldOfStudy}** with a target intake of **${user.targetIntakeYear}**. ${user.gpa ? `Your GPA of **${user.gpa}** ` + (parseFloat(user.gpa) >= 3.5 ? 'puts you in a competitive position.' : 'is decent, but we should strategize around it.') : 'You haven\'t added your GPA yet – this is important for university matching.'}

**✅ What's Working For You:**
${profileStrengths.length > 0 ? profileStrengths.map(s => `• ${s}`).join('\n') : '• Complete your profile to unlock strengths analysis'}
• Budget of $${user.budgetMin?.toLocaleString() || 0} - $${user.budgetMax?.toLocaleString() || 0}/year gives you ${user.budgetMax >= 50000 ? 'excellent options including top private universities' : 'good options with many quality public universities'}
• ${user.fundingPlan === 'self-funded' ? 'Being self-funded strengthens your visa application' : user.fundingPlan === 'scholarship' ? 'I\'ll prioritize universities with scholarship opportunities' : 'A mixed funding approach is practical and flexible'}

**⚠️ Areas That Need Attention:**
${profileGaps.length > 0 ? profileGaps.map(g => `• ${g}`).join('\n') : '• Your profile is looking complete!'}

**🎯 My Recommendation:**
${getPersonalizedRecommendation(user, profileGaps)}

Want me to show you specific universities that match your profile? Just say **"recommend universities"**!`;
  }
  
  // University Recommendations
  if (lowerMessage.includes('recommend') || lowerMessage.includes('universit') || lowerMessage.includes('college') || lowerMessage.includes('school')) {
    const countries = user.preferredCountries || ['United States'];
    
    return `Based on your profile, here's my curated list of universities for **${user.intendedDegree} in ${user.fieldOfStudy}**:

**🌟 Dream Universities** *(Reach schools – competitive but absolutely worth trying)*
${getDreamUniversities(user, countries)}

These are prestigious programs where your profile would need to shine. ${parseFloat(user.gpa) >= 3.7 ? 'Your strong GPA gives you a fighting chance!' : 'A compelling SOP and strong recommendations will be crucial here.'}

**🎯 Target Universities** *(Great match – realistic with your profile)*
${getTargetUniversities(user, countries)}

These universities have programs that align well with your background. Your acceptance chances here are solid.

**✅ Safe Universities** *(High confidence – likely admits)*
${getSafeUniversities(user, countries)}

These are quality programs where you're likely to get admitted, often with funding opportunities.

**💡 My Advice:**
I recommend shortlisting **2-3 Dream**, **3-4 Target**, and **2-3 Safe** schools. This balanced approach maximizes your chances while still aiming high.

Head to the **Universities** tab to explore these in detail, or ask me about any specific university – I'll explain exactly why it's right (or risky) for you!`;
  }
  
  // Next steps and what to do
  if (lowerMessage.includes('next') || lowerMessage.includes('what should') || lowerMessage.includes('todo') || lowerMessage.includes('to do') || lowerMessage.includes('task')) {
    return getNextStepsResponse(user, shortlistedCount, lockedCount, profileGaps);
  }
  
  // Shortlisting help
  if (lowerMessage.includes('shortlist') || lowerMessage.includes('add') || lowerMessage.includes('save')) {
    return `To shortlist a university, head over to the **Universities** tab. There you'll see recommendations tailored to your profile.

Each university card has a **"Shortlist"** button – click it to add the university to your list. You can categorize them as:
• **Dream** – Competitive reach schools
• **Target** – Good match for your profile  
• **Safe** – High acceptance probability

I recommend having **6-8 universities** total across all categories.

Currently, you have **${shortlistedCount} universities** shortlisted. ${shortlistedCount < 5 ? 'You should add more to have good options!' : 'Good progress!'}`;
  }
  
  // Lock university help
  if (lowerMessage.includes('lock') || lowerMessage.includes('finalize') || lowerMessage.includes('confirm')) {
    if (shortlistedCount === 0) {
      return `Before you can lock a university, you need to shortlist some options first. Head to the **Universities** tab to browse and shortlist universities.

Once you have a shortlist, locking a university tells me you're committed to applying there. I'll then create a complete application checklist with:
• All required documents
• Deadline reminders
• Step-by-step tasks

Start by shortlisting 5-8 universities, then we'll work together to decide which ones to lock!`;
    }
    
    return `Locking a university means you're committed to applying there. Once locked, I'll create a personalized application plan with tasks and deadlines.

You have **${shortlistedCount} universities** shortlisted. To lock one:
1. Go to **My Shortlist** section
2. Click the **Lock** button on your chosen university

${lockedCount > 0 ? `You've already locked ${lockedCount} university(ies) – great progress!` : 'I recommend locking at least 3-4 universities to have solid options.'}

Need help deciding which to lock? Tell me which universities you're considering and I'll give you my honest opinion!`;
  }
  
  // Application and deadlines
  if (lowerMessage.includes('deadline') || lowerMessage.includes('application') || lowerMessage.includes('apply') || lowerMessage.includes('when')) {
    return `Great question! Let me break down the typical timeline for **${user.targetIntakeYear}** intake:

**📅 Key Deadlines:**
• **Fall intake** (September start): Applications usually due December-February
• **Spring intake** (January start): Applications due August-October

**📋 Your Application Checklist:**
${user.sopStatus !== 'ready' ? '• ⏳ Statement of Purpose – Start ASAP, takes 2-4 weeks to perfect' : '• ✅ Statement of Purpose – Ready'}
${user.ieltsStatus !== 'completed' ? '• ⏳ English Test Score – Book exam at least 2 months before deadlines' : '• ✅ English Test – Completed'}
• 📄 Letters of Recommendation – Request from professors/employers now
• 💰 Financial Documents – Bank statements, sponsor letters
• 📝 Transcripts – Order official copies from your university

${lockedCount > 0 ? '**Go to the Application Guide tab for your personalized task list with specific deadlines!**' : '**Lock a university to get a personalized application timeline!**'}`;
  }
  
  // Budget and costs
  if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('money') || lowerMessage.includes('afford') || lowerMessage.includes('expensive')) {
    return `Let's talk money, ${firstName}. Your budget of **$${user.budgetMin?.toLocaleString() || 0} - $${user.budgetMax?.toLocaleString() || 0}/year** ${user.budgetMax >= 50000 ? 'opens up excellent options!' : 'is workable with smart planning.'}

**💰 Cost Breakdown by Country:**
• **USA**: $30,000-$60,000/year (private) | $15,000-$35,000 (public)
• **Canada**: $15,000-$35,000/year
• **UK**: $20,000-$45,000/year
• **Germany**: Nearly FREE tuition + $12,000/year living
• **Australia**: $20,000-$45,000/year

**🎓 Funding Options:**
${user.fundingPlan === 'scholarship' || user.fundingPlan === 'mixed' ? `
• **Merit Scholarships** – Many universities offer 20-100% tuition waivers
• **Assistantships** – Teaching/Research roles that cover tuition + stipend
• **External Scholarships** – Fulbright, DAAD, Commonwealth, etc.` : ''}
• **Education Loans** – Cover full costs, repay after graduation
• **Work While Studying** – Most countries allow 20 hrs/week

I'll prioritize recommending universities with good funding options for your profile!`;
  }
  
  // SOP help
  if (lowerMessage.includes('sop') || lowerMessage.includes('statement') || lowerMessage.includes('essay') || lowerMessage.includes('purpose')) {
    return `The Statement of Purpose is CRUCIAL – it's where you differentiate yourself. Here's how to write a compelling SOP:

**📝 SOP Structure (750-1000 words):**

**1. Hook (1 paragraph)**
Start with a specific moment or experience that sparked your interest in ${user.fieldOfStudy}. Make it personal and memorable.

**2. Academic Journey (1-2 paragraphs)**
Your background in ${user.major || user.fieldOfStudy}, key projects, research, achievements. Connect the dots to show progression.

**3. Why This Field? (1 paragraph)**
Your specific interests within ${user.fieldOfStudy}. What problems do you want to solve?

**4. Why This University? (1 paragraph)**
Mention specific professors, labs, courses. Show you've done your research!

**5. Career Goals (1 paragraph)**
Where do you see yourself in 5-10 years? Be specific and ambitious.

**⚠️ Common Mistakes to Avoid:**
• Generic statements that could apply to anyone
• Listing achievements without showing growth
• Not researching the specific program

Your current SOP status: **${user.sopStatus}**
${user.sopStatus === 'not-started' ? '👉 I recommend starting your SOP this week!' : user.sopStatus === 'draft' ? '👉 Great progress! Keep refining it.' : '👉 Excellent – you\'re ahead of the game!'}`;
  }
  
  // Default contextual response
  return getContextualDefaultResponse(user, firstName, shortlistedCount, lockedCount, profileGaps);
}

// Helper functions for enhanced responses
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getPersonalizedRecommendation(user, gaps) {
  if (gaps.includes('English proficiency test not started')) {
    return `**Priority #1: Book your IELTS/TOEFL exam immediately.** Most universities require this, and scores take 2-3 weeks to arrive. This is your most time-sensitive task.`;
  }
  if (gaps.includes('SOP not started')) {
    return `**Start drafting your Statement of Purpose.** A strong SOP can compensate for a lower GPA and is often the deciding factor between similar candidates.`;
  }
  if (gaps.includes('GPA not provided')) {
    return `**Add your GPA to your profile.** This helps me give you more accurate university recommendations.`;
  }
  return `**You're on track!** Focus on finalizing your university shortlist and start preparing application materials.`;
}

function getDreamUniversities(user, countries) {
  const field = user.fieldOfStudy?.toLowerCase() || '';
  
  if (countries.includes('United States') || countries.includes('USA')) {
    if (field.includes('computer') || field.includes('software') || field.includes('data')) {
      return `• **Stanford University** – Top 3 globally for CS, amazing Silicon Valley connections
• **MIT** – Legendary tech programs, unmatched research opportunities
• **Carnegie Mellon** – #1 for AI/ML, excellent industry partnerships`;
    }
    if (field.includes('business') || field.includes('mba') || field.includes('finance')) {
      return `• **Harvard Business School** – The gold standard of business education
• **Wharton (UPenn)** – Exceptional for finance and analytics
• **Stanford GSB** – Perfect for tech + business intersection`;
    }
    return `• **Stanford University** – World-class across all disciplines
• **Harvard University** – Unmatched brand recognition and network
• **MIT** – Excellent for STEM and interdisciplinary programs`;
  }
  
  if (countries.includes('United Kingdom') || countries.includes('UK')) {
    return `• **University of Oxford** – Historic excellence, tutorial-based learning
• **University of Cambridge** – Research powerhouse, strong ${field} department
• **Imperial College London** – Top for STEM, industry connections`;
  }
  
  if (countries.includes('Canada')) {
    return `• **University of Toronto** – Canada's #1, global top 20
• **McGill University** – Excellent reputation, vibrant Montreal location
• **UBC** – Strong programs, beautiful Vancouver campus`;
  }
  
  return `• Top universities in your preferred countries
• Research-intensive institutions with global rankings
• Programs with strong industry connections`;
}

function getTargetUniversities(user, countries) {
  const field = user.fieldOfStudy?.toLowerCase() || '';
  
  if (countries.includes('United States') || countries.includes('USA')) {
    return `• **University of Michigan** – Excellent programs, strong funding
• **Georgia Tech** – Top for engineering, great value
• **UT Austin** – Strong academics, vibrant culture
• **UCSD** – Growing reputation, beautiful campus`;
  }
  
  if (countries.includes('United Kingdom') || countries.includes('UK')) {
    return `• **University of Edinburgh** – Beautiful city, strong programs
• **University of Manchester** – Industry partnerships, diverse community
• **King's College London** – Central London, excellent networking`;
  }
  
  if (countries.includes('Canada')) {
    return `• **University of Waterloo** – Co-op programs, tech connections
• **Western University** – Strong programs, welcoming community
• **Simon Fraser University** – Good funding opportunities`;
  }
  
  return `• Well-ranked universities matching your profile
• Programs with strong placement records
• Good balance of academics and opportunities`;
}

function getSafeUniversities(user, countries) {
  if (countries.includes('United States') || countries.includes('USA')) {
    return `• **Arizona State University** – Innovative programs, high acceptance
• **University of South Florida** – Good funding, growing reputation
• **Northeastern University** – Excellent co-op program`;
  }
  
  if (countries.includes('Canada')) {
    return `• **Concordia University** – Montreal location, affordable
• **University of Ottawa** – Bilingual advantage, co-op options
• **Dalhousie University** – Maritime beauty, welcoming community`;
  }
  
  if (countries.includes('Germany')) {
    return `• **TU Munich** – World-class, nearly free tuition!
• **RWTH Aachen** – Excellent engineering, industry connections
• **TU Berlin** – Capital city, startup ecosystem`;
  }
  
  return `• Quality universities with higher acceptance rates
• Programs offering scholarships to international students
• Good pathway to work opportunities post-graduation`;
}

function getNextStepsResponse(user, shortlistedCount, lockedCount, gaps) {
  const firstName = user.fullName?.split(' ')[0] || 'there';
  
  if (shortlistedCount === 0) {
    return `${firstName}, here's exactly what you need to do right now:

**🎯 Immediate Priority: Build Your University Shortlist**

You haven't shortlisted any universities yet, and this should be your focus:

1. **Go to the Universities tab** (right now!)
2. **Browse the recommendations** – I've already filtered them for your profile
3. **Shortlist 6-8 universities** across Dream, Target, and Safe categories

**⏰ While You're Exploring, Also Consider:**
${gaps.includes('English proficiency test not started') ? '• Book your IELTS/TOEFL exam – this takes time!' : ''}
${gaps.includes('SOP not started') ? '• Start brainstorming your SOP topics' : ''}
• Research 2-3 professors whose work interests you

The **single most important thing** you can do today is shortlist at least 3 universities. Ready? Head to the Universities tab!`;
  }
  
  if (lockedCount === 0) {
    return `Nice work having ${shortlistedCount} universities shortlisted, ${firstName}! Here's what's next:

**🎯 Current Priority: Lock Your Top Choices**

Locking a university signals commitment and unlocks personalized application guidance. Here's my suggested approach:

1. **Review your shortlist** – Which universities excite you most?
2. **Lock 3-4 universities** – Include at least 1 Target and 1 Safe school
3. **Check Application Guide** – I'll create a task list once you lock

**📋 In Parallel, Start Working On:**
${gaps.includes('SOP not started') ? '• **Statement of Purpose** – Start drafting this week\n' : ''}${gaps.includes('English proficiency test not started') ? '• **IELTS/TOEFL** – Register for an exam date\n' : ''}• **Letters of Recommendation** – Identify 2-3 recommenders

Need help deciding which universities to lock? Ask me about any specific school on your list!`;
  }
  
  return `${firstName}, you're in great shape with ${lockedCount} locked universities! Here's your action plan:

**🎯 Application Preparation Phase**

**This Week:**
${gaps.includes('SOP not started') ? '• Draft your Statement of Purpose' : '• Finalize and polish your SOP'}
• Request Letters of Recommendation from professors/employers
• Gather financial documents (bank statements, sponsor letters)

**This Month:**
${gaps.includes('English proficiency test not started') ? '• Take your IELTS/TOEFL exam' : '• Ensure test scores are sent to universities'}
• Order official transcripts from your institution
• Research scholarship opportunities for each locked university

**Before Deadlines:**
• Complete and submit all applications
• Pay application fees
• Track application status

**👉 Go to the Application Guide tab** for your complete personalized checklist with specific tasks for each locked university!`;
}

function getContextualDefaultResponse(user, firstName, shortlistedCount, lockedCount, gaps) {
  // Provide a contextual response based on user's current state
  if (user.currentStage <= 2 && shortlistedCount === 0) {
    return `I'm here to help, ${firstName}! Based on where you are in your journey, I think we should focus on finding the right universities for you.

I can see you're targeting a **${user.intendedDegree} in ${user.fieldOfStudy}**. That's a great choice! Here are some things I can help you with:

**Quick Actions:**
• Say **"analyze my profile"** – I'll assess your strengths and gaps
• Say **"recommend universities"** – Get personalized suggestions
• Say **"what should I do next?"** – Clear action items

What sounds most helpful right now?`;
  }
  
  return `I'm here to help, ${firstName}! Here's what I can do for you:

**🔍 Profile & Analysis:**
• "Analyze my profile" – Full strength and gaps assessment
• "Am I a good fit for [university name]?" – Personalized evaluation

**🎓 Universities:**
• "Recommend universities" – Dream, Target, Safe options
• "Tell me about [university name]" – Detailed insights
• "Compare [university A] vs [university B]"

**📋 Planning & Tasks:**
• "What should I do next?" – Prioritized action items
• "Help me with my SOP" – Writing guidance
• "What are the deadlines?"

**Current Status:**
• Shortlisted: ${shortlistedCount} universities
• Locked: ${lockedCount} universities
• Stage: ${user.currentStage <= 2 ? 'Discovery' : user.currentStage === 3 ? 'Finalizing' : 'Application Prep'}

What would you like to explore?`;
}

// AI-led onboarding conversation
router.post('/onboarding-chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory, collectedData } = req.body;
    const user = await User.findById(req.userId);
    
    // Always use fallback for reliable responses
    const fallbackResponse = getFallbackOnboardingResponse(message, conversationHistory, collectedData || {});
    
    // If no API key, return fallback immediately
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      return res.json(fallbackResponse);
    }

    // Build conversation context for onboarding
    const systemPrompt = `You are an AI counsellor helping a student complete their study abroad profile through a natural voice conversation. Your name is Alex.

STUDENT NAME: ${user.fullName}

YOUR GOAL: Collect the following information through natural conversation:
1. Education Level (high-school, bachelors, masters, working professional)
2. Current Degree and Major (e.g., B.Tech in Computer Science)
3. Graduation Year
4. GPA or Percentage (optional)
5. Intended Degree (bachelors, masters, mba, phd)
6. Field of Study they want to pursue
7. Target Intake Year (2024, 2025, 2026)
8. Preferred Countries (USA, Canada, UK, Australia, Germany, etc.)
9. Budget Range (minimum and maximum per year in USD)
10. Funding Plan (self-funded, scholarship-dependent, loan, mixed)
11. English Test Status (IELTS/TOEFL - not-started, in-progress, completed)
12. GRE/GMAT Status (not-started, in-progress, completed, not-required)
13. SOP Status (not-started, draft, ready)

CONVERSATION RULES:
- Be friendly, encouraging, and conversational
- Ask ONE question at a time
- Acknowledge their answers before moving to the next question
- If an answer is unclear, politely ask for clarification
- Accept natural language answers and extract the relevant data
- Keep responses concise (2-3 sentences max)
- Don't repeat information they've already given

RESPONSE FORMAT:
You must respond with a JSON object containing:
{
  "reply": "Your conversational response to the user",
  "extractedData": { extracted fields as key-value pairs, or null if no new data },
  "isComplete": false,
  "collectedFields": ["list of fields collected so far"],
  "nextQuestion": "what field you're asking about next"
}

When ALL required fields are collected, set isComplete to true and include:
{
  "reply": "Great! I have all the information I need. Let me set up your profile now...",
  "extractedData": null,
  "isComplete": true,
  "finalData": { complete profile object with all fields }
}

FIELD MAPPING:
- Education Level → educationLevel
- Degree → degree
- Major → major  
- Graduation Year → graduationYear
- GPA → gpa
- Intended Degree → intendedDegree
- Field of Study → fieldOfStudy
- Target Year → targetIntakeYear
- Countries → preferredCountries (array)
- Budget Min → budgetMin
- Budget Max → budgetMax
- Funding → fundingPlan
- IELTS/TOEFL → ieltsStatus
- GRE/GMAT → greStatus
- SOP → sopStatus`;

    // Build the messages for the AI
    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: JSON.stringify({
        reply: `Hello ${user.fullName.split(' ')[0]}! I'm Alex, your AI counsellor. I'll help you set up your study abroad profile through a quick conversation. Let's start - what is your current education level? Are you in high school, completing your bachelor's, already have a master's, or are you a working professional?`,
        extractedData: null,
        isComplete: false,
        collectedFields: [],
        nextQuestion: "educationLevel"
      }) }] }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({ history: messages });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    let aiResponse = response.text();

    // Try to parse as JSON
    try {
      // Clean up the response if needed
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(aiResponse);
      
      res.json({
        reply: parsed.reply,
        extractedData: parsed.extractedData,
        isComplete: parsed.isComplete || false,
        finalData: parsed.finalData || null
      });
    } catch (parseError) {
      // If parsing fails, just return the text response
      res.json({
        reply: aiResponse,
        extractedData: null,
        isComplete: false,
        finalData: null
      });
    }
  } catch (error) {
    console.error('Onboarding chat error:', error);
    // On any error, return fallback response instead of failing
    const { message: userMessage, conversationHistory, collectedData } = req.body;
    const fallbackResponse = getFallbackOnboardingResponse(userMessage, conversationHistory, collectedData || {});
    res.json(fallbackResponse);
  }
});

// Fallback onboarding responses - improved version
function getFallbackOnboardingResponse(message, history, collectedData = {}) {
  const historyLength = history?.length || 0;
  const lowerMessage = message.toLowerCase().trim();
  
  console.log('getFallbackOnboardingResponse called with:', { message, collectedData });
  
  // Determine which question we're on based on what data we've collected
  const hasEducation = !!collectedData.educationLevel;
  const hasMajor = !!collectedData.major || !!collectedData.fieldOfStudy;
  const hasDegree = !!collectedData.intendedDegree;
  const hasCountries = collectedData.preferredCountries?.length > 0;
  const hasBudget = !!collectedData.budgetMax;
  const hasFunding = !!collectedData.fundingPlan;
  const hasIelts = !!collectedData.ieltsStatus;
  const hasGre = !!collectedData.greStatus;
  const hasSop = !!collectedData.sopStatus;
  
  console.log('Field status:', { hasEducation, hasMajor, hasDegree, hasCountries, hasBudget, hasFunding, hasIelts, hasGre, hasSop });

  // Question 1: Education Level
  if (!hasEducation) {
    let educationLevel = 'bachelors';
    if (lowerMessage.includes('master') || lowerMessage.includes('mtech') || lowerMessage.includes('m.tech') || lowerMessage.includes('postgrad')) {
      educationLevel = 'masters';
    } else if (lowerMessage.includes('high school') || lowerMessage.includes('12th') || lowerMessage.includes('school') || lowerMessage.includes('plus two')) {
      educationLevel = 'high-school';
    } else if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('professional') || lowerMessage.includes('employ')) {
      educationLevel = 'working';
    } else if (lowerMessage.includes('bachelor') || lowerMessage.includes('btech') || lowerMessage.includes('b.tech') || lowerMessage.includes('bsc') || lowerMessage.includes('b.sc') || lowerMessage.includes('undergrad') || lowerMessage.includes('degree') || lowerMessage.includes('engineering') || lowerMessage.includes('college')) {
      educationLevel = 'bachelors';
    }
    
    return {
      reply: `Great, so you're at the ${educationLevel.replace('-', ' ')} level! What is your major or field of study? For example, Computer Science, Business, Engineering, Biology, etc.`,
      extractedData: { educationLevel },
      isComplete: false,
      finalData: null
    };
  }

  // Question 2: Major/Field
  if (!hasMajor) {
    const fieldWords = message.split(/\s+/).filter(w => w.length > 2);
    let field = fieldWords.join(' ') || 'General Studies';
    
    // Common field detection
    const fields = {
      'computer': 'Computer Science',
      'cs': 'Computer Science',
      'software': 'Software Engineering',
      'it': 'Information Technology',
      'data': 'Data Science',
      'engineering': 'Engineering',
      'mechanical': 'Mechanical Engineering',
      'electrical': 'Electrical Engineering',
      'civil': 'Civil Engineering',
      'business': 'Business Administration',
      'mba': 'Business Administration',
      'finance': 'Finance',
      'marketing': 'Marketing',
      'economics': 'Economics',
      'biology': 'Biology',
      'chemistry': 'Chemistry',
      'physics': 'Physics',
      'math': 'Mathematics',
      'psychology': 'Psychology',
      'medicine': 'Medicine',
      'law': 'Law'
    };
    
    for (const [key, value] of Object.entries(fields)) {
      if (lowerMessage.includes(key)) {
        field = value;
        break;
      }
    }

    return {
      reply: `${field}, excellent choice! Now, what degree are you planning to pursue abroad? A Master's degree, MBA, PhD, or a Bachelor's?`,
      extractedData: { major: field, fieldOfStudy: field, degree: `Bachelor's in ${field}` },
      isComplete: false,
      finalData: null
    };
  }

  // Question 3: Intended Degree
  if (!hasDegree) {
    let intendedDegree = 'masters';
    if (lowerMessage.includes('mba') || lowerMessage.includes('business admin')) {
      intendedDegree = 'mba';
    } else if (lowerMessage.includes('phd') || lowerMessage.includes('doctor') || lowerMessage.includes('research')) {
      intendedDegree = 'phd';
    } else if (lowerMessage.includes('bachelor') || lowerMessage.includes('undergrad') || lowerMessage.includes('ug')) {
      intendedDegree = 'bachelors';
    } else if (lowerMessage.includes('master') || lowerMessage.includes('ms') || lowerMessage.includes('mtech') || lowerMessage.includes('pg') || lowerMessage.includes('postgrad')) {
      intendedDegree = 'masters';
    }

    return {
      reply: `A ${intendedDegree === 'mba' ? 'MBA' : intendedDegree} degree, great goal! Which countries are you interested in studying? You can mention multiple countries like USA, Canada, UK, Germany, or Australia.`,
      extractedData: { intendedDegree },
      isComplete: false,
      finalData: null
    };
  }

  // Question 4: Preferred Countries
  if (!hasCountries) {
    const countries = [];
    const countryMap = {
      'usa': 'United States', 'us': 'United States', 'america': 'United States', 'united states': 'United States', 'states': 'United States',
      'canada': 'Canada', 'canadian': 'Canada',
      'uk': 'United Kingdom', 'britain': 'United Kingdom', 'england': 'United Kingdom', 'united kingdom': 'United Kingdom', 'london': 'United Kingdom',
      'germany': 'Germany', 'german': 'Germany', 'berlin': 'Germany',
      'australia': 'Australia', 'aussie': 'Australia', 'sydney': 'Australia', 'melbourne': 'Australia',
      'singapore': 'Singapore',
      'netherlands': 'Netherlands', 'holland': 'Netherlands',
      'ireland': 'Ireland',
      'france': 'France', 'paris': 'France',
      'switzerland': 'Switzerland'
    };
    
    for (const [key, value] of Object.entries(countryMap)) {
      if (lowerMessage.includes(key) && !countries.includes(value)) {
        countries.push(value);
      }
    }
    
    if (countries.length === 0) {
      countries.push('United States'); // Default
    }

    return {
      reply: `${countries.join(', ')} - excellent choices! What's your budget range per year for tuition and living expenses? Just give me an approximate number in dollars, like 40000 or 50000.`,
      extractedData: { preferredCountries: countries },
      isComplete: false,
      finalData: null
    };
  }

  // Question 5: Budget
  if (!hasBudget) {
    const numbers = message.match(/\d+/g);
    let budgetMin = 30000;
    let budgetMax = 60000;
    
    if (numbers && numbers.length > 0) {
      const val = parseInt(numbers[0]);
      if (val < 1000) {
        // Probably in thousands
        budgetMax = val * 1000;
        budgetMin = Math.max(budgetMax - 20000, 10000);
      } else {
        budgetMax = val;
        budgetMin = Math.max(val - 20000, 10000);
      }
    }

    return {
      reply: `Got it, around $${budgetMin.toLocaleString()} to $${budgetMax.toLocaleString()} per year. How do you plan to fund your education? Self-funded, scholarships, education loan, or a mix of these?`,
      extractedData: { budgetMin, budgetMax },
      isComplete: false,
      finalData: null
    };
  }

  // Question 6: Funding
  if (!hasFunding) {
    let fundingPlan = 'mixed';
    if (lowerMessage.includes('self') || lowerMessage.includes('own') || lowerMessage.includes('family') || lowerMessage.includes('parent')) {
      fundingPlan = 'self-funded';
    } else if (lowerMessage.includes('scholarship') || lowerMessage.includes('aid') || lowerMessage.includes('assist')) {
      fundingPlan = 'scholarship';
    } else if (lowerMessage.includes('loan') || lowerMessage.includes('bank') || lowerMessage.includes('borrow')) {
      fundingPlan = 'loan';
    } else if (lowerMessage.includes('mix') || lowerMessage.includes('both') || lowerMessage.includes('combination')) {
      fundingPlan = 'mixed';
    }

    return {
      reply: `${fundingPlan.replace('-', ' ')} funding, understood! Have you taken or are you preparing for any English tests like IELTS or TOEFL? Just say completed, preparing, or not started.`,
      extractedData: { fundingPlan },
      isComplete: false,
      finalData: null
    };
  }

  // Question 7: IELTS/TOEFL
  if (!hasIelts) {
    let ieltsStatus = 'not-started';
    if (lowerMessage.includes('done') || lowerMessage.includes('completed') || lowerMessage.includes('yes') || lowerMessage.includes('taken') || lowerMessage.includes('gave') || lowerMessage.includes('finished')) {
      ieltsStatus = 'completed';
    } else if (lowerMessage.includes('preparing') || lowerMessage.includes('studying') || lowerMessage.includes('progress') || lowerMessage.includes('soon') || lowerMessage.includes('scheduled')) {
      ieltsStatus = 'in-progress';
    } else if (lowerMessage.includes('no') || lowerMessage.includes('not') || lowerMessage.includes('haven')) {
      ieltsStatus = 'not-started';
    }

    return {
      reply: `English test status noted! What about GRE or GMAT? Have you taken it, are you preparing for it, or is it not required for your programs?`,
      extractedData: { ieltsStatus, toeflStatus: ieltsStatus },
      isComplete: false,
      finalData: null
    };
  }

  // Question 8: GRE/GMAT
  if (!hasGre) {
    let greStatus = 'not-started';
    if (lowerMessage.includes('done') || lowerMessage.includes('completed') || lowerMessage.includes('yes') || lowerMessage.includes('taken') || lowerMessage.includes('gave')) {
      greStatus = 'completed';
    } else if (lowerMessage.includes('preparing') || lowerMessage.includes('studying') || lowerMessage.includes('progress') || lowerMessage.includes('soon')) {
      greStatus = 'in-progress';
    } else if (lowerMessage.includes('not required') || lowerMessage.includes('don\'t need') || lowerMessage.includes('waiver') || lowerMessage.includes('exempt')) {
      greStatus = 'not-required';
    } else if (lowerMessage.includes('no') || lowerMessage.includes('not') || lowerMessage.includes('haven')) {
      greStatus = 'not-started';
    }

    return {
      reply: `Got it! Last question - have you started working on your Statement of Purpose? Is it ready, in draft, or not started yet?`,
      extractedData: { greStatus, gmatStatus: greStatus },
      isComplete: false,
      finalData: null
    };
  }

  // Question 9: SOP - Final
  if (!hasSop) {
    let sopStatus = 'not-started';
    if (lowerMessage.includes('ready') || lowerMessage.includes('done') || lowerMessage.includes('completed') || lowerMessage.includes('finished') || lowerMessage.includes('yes')) {
      sopStatus = 'ready';
    } else if (lowerMessage.includes('draft') || lowerMessage.includes('working') || lowerMessage.includes('progress') || lowerMessage.includes('writing')) {
      sopStatus = 'draft';
    } else if (lowerMessage.includes('no') || lowerMessage.includes('not') || lowerMessage.includes('haven')) {
      sopStatus = 'not-started';
    }

    // All data collected - complete!
    const finalData = {
      ...collectedData,
      sopStatus,
      graduationYear: new Date().getFullYear(),
      targetIntakeYear: new Date().getFullYear() + 1
    };

    return {
      reply: `Perfect! I've collected all the information I need. Let me set up your profile now. You'll be redirected to your dashboard in a moment!`,
      extractedData: { sopStatus },
      isComplete: true,
      finalData
    };
  }

  // Fallback - should not reach here
  return {
    reply: "I understand. Let me set up your profile with the information we've gathered.",
    extractedData: null,
    isComplete: true,
    finalData: collectedData
  };
}

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({ userId: req.userId });
    res.json(chatHistory?.messages || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get AI profile analysis
router.get('/analyze-profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.onboardingCompleted) {
      return res.status(403).json({ message: 'Complete onboarding first' });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      return res.json({ 
        analysis: getFallbackResponse('analyze my profile', user) 
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze this student profile for study abroad:
    
Education: ${user.educationLevel} in ${user.major}
GPA: ${user.gpa}
Target: ${user.intendedDegree} in ${user.fieldOfStudy}
Countries: ${user.preferredCountries?.join(', ')}
Budget: $${user.budgetMin}-$${user.budgetMax}/year
IELTS: ${user.ieltsStatus} ${user.ieltsScore || ''}
GRE: ${user.greStatus} ${user.greScore || ''}
SOP: ${user.sopStatus}

Provide a brief analysis with:
1. Profile Strengths (2-3 points)
2. Areas to Improve (2-3 points)  
3. Immediate Next Steps (2-3 actionable items)

Keep it concise and actionable.`;
    
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();
    
    res.json({ analysis });
  } catch (error) {
    const user = await User.findById(req.userId);
    res.json({ 
      analysis: getFallbackResponse('analyze my profile', user) 
    });
  }
});

module.exports = router;
