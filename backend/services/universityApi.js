const axios = require('axios');

// Hipo Labs Universities API - Free API with real university data
const UNIVERSITIES_API = 'http://universities.hipolabs.com/search';

// Fetch universities by country
async function fetchUniversitiesByCountry(country) {
  try {
    const response = await axios.get(UNIVERSITIES_API, {
      params: { country }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching universities for ${country}:`, error.message);
    return [];
  }
}

// Transform API data to our schema format with estimated values
function transformUniversityData(apiData, countryDefaults) {
  return {
    name: apiData.name,
    country: apiData.country,
    city: apiData['state-province'] || countryDefaults.defaultCity,
    website: apiData.web_pages?.[0] || '',
    
    // Estimated values based on country averages
    ranking: countryDefaults.baseRanking + Math.floor(Math.random() * 200),
    acceptanceRate: countryDefaults.avgAcceptanceRate + Math.floor(Math.random() * 30 - 15),
    internationalStudentRatio: countryDefaults.avgInternationalRatio + Math.floor(Math.random() * 20 - 10),
    scholarshipsAvailable: Math.random() > 0.3,
    tuitionFee: countryDefaults.avgTuition + Math.floor(Math.random() * 20000 - 10000),
    livingCostPerYear: countryDefaults.avgLivingCost + Math.floor(Math.random() * 5000 - 2500),
    applicationFee: countryDefaults.avgAppFee,
    description: `${apiData.name} is a university located in ${apiData.country}.`,
    
    // Default programs based on country
    programs: generateDefaultPrograms(countryDefaults)
  };
}

// Generate default programs with country-specific tuition
function generateDefaultPrograms(countryDefaults) {
  const basePrograms = [
    // Bachelor's Programs
    { name: 'BS in Computer Science', degree: 'bachelors', field: 'Computer Science', duration: '4 years' },
    { name: 'BS in Data Science', degree: 'bachelors', field: 'Data Science', duration: '4 years' },
    { name: 'BS in Electrical Engineering', degree: 'bachelors', field: 'Engineering', duration: '4 years' },
    { name: 'BS in Mechanical Engineering', degree: 'bachelors', field: 'Engineering', duration: '4 years' },
    { name: 'BS in Business Administration', degree: 'bachelors', field: 'Business', duration: '4 years' },
    { name: 'BA in Economics', degree: 'bachelors', field: 'Business', duration: '4 years' },
    
    // Master's Programs
    { name: 'MS in Computer Science', degree: 'masters', field: 'Computer Science', duration: '2 years' },
    { name: 'MS in Data Science', degree: 'masters', field: 'Data Science', duration: '1.5 years' },
    { name: 'MS in Artificial Intelligence', degree: 'masters', field: 'Artificial Intelligence', duration: '2 years' },
    { name: 'MS in Business Analytics', degree: 'masters', field: 'Business', duration: '1 year' },
    { name: 'MS in Electrical Engineering', degree: 'masters', field: 'Engineering', duration: '2 years' },
    { name: 'MS in Mechanical Engineering', degree: 'masters', field: 'Engineering', duration: '2 years' },
    
    // MBA
    { name: 'MBA', degree: 'mba', field: 'Business', duration: '2 years' },
    
    // PhD Programs
    { name: 'PhD in Computer Science', degree: 'phd', field: 'Computer Science', duration: '4-5 years' },
    { name: 'PhD in Data Science', degree: 'phd', field: 'Data Science', duration: '4-5 years' },
    { name: 'PhD in Electrical Engineering', degree: 'phd', field: 'Engineering', duration: '4-5 years' },
    { name: 'PhD in Mechanical Engineering', degree: 'phd', field: 'Engineering', duration: '4-5 years' },
    { name: 'PhD in Business Administration', degree: 'phd', field: 'Business', duration: '4-5 years' },
    { name: 'PhD in Economics', degree: 'phd', field: 'Business', duration: '4-5 years' }
  ];
  
  return basePrograms.map(prog => {
    let tuition = countryDefaults.avgTuition;
    let minGPA = 3.0;
    let ieltsMin = 6.5;
    let toeflMin = 90;
    
    if (prog.degree === 'bachelors') {
      tuition = countryDefaults.avgTuition * 0.9;
      minGPA = 2.5 + Math.random() * 0.5;
      ieltsMin = 6.0;
      toeflMin = 80;
    } else if (prog.degree === 'masters') {
      tuition = countryDefaults.avgTuition;
      minGPA = 3.0 + Math.random() * 0.5;
      ieltsMin = 6.5;
      toeflMin = 90;
    } else if (prog.degree === 'mba') {
      tuition = countryDefaults.avgTuition * 1.5;
      minGPA = 3.0 + Math.random() * 0.5;
      ieltsMin = 7.0;
      toeflMin = 100;
    } else if (prog.degree === 'phd') {
      tuition = countryDefaults.avgTuition * 0.5; // Often funded/reduced
      minGPA = 3.3 + Math.random() * 0.4;
      ieltsMin = 7.0;
      toeflMin = 100;
    }
    
    return {
      ...prog,
      tuitionPerYear: Math.round(tuition),
      requirements: {
        minGPA: Math.round(minGPA * 10) / 10,
        ieltsMin,
        toeflMin,
        greRequired: prog.degree === 'masters' || prog.degree === 'phd',
        gmatRequired: prog.degree === 'mba'
      }
    };
  });
}

// Country-specific defaults for realistic data
const countryDefaults = {
  'United States': {
    defaultCity: 'Various',
    baseRanking: 50,
    avgAcceptanceRate: 50,
    avgInternationalRatio: 15,
    avgTuition: 45000,
    avgLivingCost: 18000,
    avgAppFee: 80
  },
  'United Kingdom': {
    defaultCity: 'Various',
    baseRanking: 40,
    avgAcceptanceRate: 40,
    avgInternationalRatio: 35,
    avgTuition: 28000,
    avgLivingCost: 15000,
    avgAppFee: 50
  },
  'Canada': {
    defaultCity: 'Various',
    baseRanking: 60,
    avgAcceptanceRate: 55,
    avgInternationalRatio: 25,
    avgTuition: 35000,
    avgLivingCost: 14000,
    avgAppFee: 100
  },
  'Germany': {
    defaultCity: 'Various',
    baseRanking: 80,
    avgAcceptanceRate: 45,
    avgInternationalRatio: 20,
    avgTuition: 500,
    avgLivingCost: 12000,
    avgAppFee: 0
  },
  'Australia': {
    defaultCity: 'Various',
    baseRanking: 70,
    avgAcceptanceRate: 60,
    avgInternationalRatio: 30,
    avgTuition: 38000,
    avgLivingCost: 16000,
    avgAppFee: 100
  },
  'Singapore': {
    defaultCity: 'Singapore',
    baseRanking: 30,
    avgAcceptanceRate: 25,
    avgInternationalRatio: 40,
    avgTuition: 40000,
    avgLivingCost: 15000,
    avgAppFee: 50
  },
  'Ireland': {
    defaultCity: 'Various',
    baseRanking: 100,
    avgAcceptanceRate: 55,
    avgInternationalRatio: 25,
    avgTuition: 25000,
    avgLivingCost: 14000,
    avgAppFee: 60
  },
  'Netherlands': {
    defaultCity: 'Various',
    baseRanking: 90,
    avgAcceptanceRate: 50,
    avgInternationalRatio: 30,
    avgTuition: 18000,
    avgLivingCost: 13000,
    avgAppFee: 100
  }
};

// Main function to fetch and transform universities
async function fetchRealUniversities(countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia']) {
  const allUniversities = [];
  
  for (const country of countries) {
    console.log(`Fetching universities from ${country}...`);
    const apiData = await fetchUniversitiesByCountry(country);
    
    const defaults = countryDefaults[country] || countryDefaults['United States'];
    
    // Take top universities (limit to avoid too many)
    const topUniversities = apiData.slice(0, 50);
    
    const transformed = topUniversities.map(uni => transformUniversityData(uni, defaults));
    allUniversities.push(...transformed);
  }
  
  return allUniversities;
}

module.exports = {
  fetchRealUniversities,
  fetchUniversitiesByCountry,
  countryDefaults
};
