/**
 * Mock AI API responses for development and testing
 */

// Mock resume analysis responses
const MOCK_RESUME_ANALYSES = [
  {
    matchScore: 85,
    missingKeywords: [
      'React',
      'Node.js',
      'TypeScript',
      'AWS',
      'Docker',
      'Kubernetes',
      'GraphQL',
      'MongoDB'
    ],
    actionVerbAnalysis: 'Your resume contains strong action verbs like "developed," "implemented," and "optimized." Consider adding more impact-focused verbs such as "architected," "spearheaded," "transformed," and "accelerated" to better showcase your leadership and technical achievements.',
    formatSuggestions: [
      'Add quantifiable metrics to your achievements (e.g., "Improved performance by 40%")',
      'Use consistent bullet point formatting throughout',
      'Include a professional summary section at the top',
      'Ensure consistent date formatting (MM/YYYY)',
      'Add relevant technical skills section',
      'Consider using a more modern, ATS-friendly template'
    ]
  },
  {
    matchScore: 72,
    missingKeywords: [
      'Python',
      'Machine Learning',
      'TensorFlow',
      'Data Analysis',
      'SQL',
      'Pandas',
      'Scikit-learn',
      'Deep Learning'
    ],
    actionVerbAnalysis: 'Your resume shows good use of technical action verbs. To strengthen it further, incorporate more results-oriented language such as "delivered," "achieved," "reduced," and "increased" with specific metrics and outcomes.',
    formatSuggestions: [
      'Reorganize sections to prioritize most relevant experience',
      'Add a technical skills section with proficiency levels',
      'Include links to portfolio projects or GitHub',
      'Use consistent formatting for job titles and companies',
      'Add relevant certifications and training',
      'Optimize for ATS scanning with standard section headers'
    ]
  },
  {
    matchScore: 91,
    missingKeywords: [
      'Agile',
      'Scrum',
      'JIRA',
      'CI/CD',
      'Jenkins',
      'Git',
      'REST APIs',
      'Microservices'
    ],
    actionVerbAnalysis: 'Excellent use of strong action verbs throughout your resume. Your language effectively demonstrates leadership and technical expertise. Consider adding a few more strategic verbs like "pioneered," "streamlined," and "mentored" to highlight innovation and team leadership.',
    formatSuggestions: [
      'Your resume format is already quite strong',
      'Consider adding a brief professional summary',
      'Ensure all achievements include quantifiable results',
      'Add relevant keywords naturally throughout the content',
      'Include any relevant side projects or open source contributions',
      'Consider adding a skills matrix for technical competencies'
    ]
  }
];

// Mock interview questions by category and role
const MOCK_INTERVIEW_QUESTIONS = {
  behavioral: {
    'Software Engineer': [
      'Tell me about a time when you had to debug a particularly challenging issue. How did you approach it?',
      'Describe a situation where you had to work with a difficult team member. How did you handle it?',
      'Can you share an example of when you had to learn a new technology quickly for a project?',
      'Tell me about a time when you disagreed with a technical decision. How did you handle it?',
      'Describe a project where you had to balance technical debt with new feature development.',
      'Tell me about a time when you had to explain a complex technical concept to a non-technical stakeholder.',
      'Can you describe a situation where you had to make a trade-off between code quality and delivery timeline?',
      'Tell me about a time when you identified and fixed a performance bottleneck in an application.',
      'Describe a situation where you had to refactor legacy code. What was your approach?',
      'Tell me about a time when you had to mentor a junior developer. How did you approach it?'
    ],
    'Product Manager': [
      'Tell me about a time when you had to prioritize features with limited resources. How did you decide?',
      'Describe a situation where you had to pivot a product strategy based on user feedback.',
      'Can you share an example of when you had to work with engineering to resolve a technical constraint?',
      'Tell me about a time when you had to communicate bad news to stakeholders. How did you handle it?',
      'Describe a product launch that didn\'t go as planned. What did you learn?',
      'Tell me about a time when you had to make a data-driven decision with incomplete information.',
      'Can you describe a situation where you had to balance user needs with business requirements?',
      'Tell me about a time when you had to influence without authority to get a project done.',
      'Describe a situation where you had to manage competing priorities from different stakeholders.',
      'Tell me about a time when you had to advocate for the user against internal pressure.'
    ],
    'Data Scientist': [
      'Tell me about a time when your initial hypothesis was wrong. How did you pivot?',
      'Describe a situation where you had to explain complex statistical concepts to business stakeholders.',
      'Can you share an example of when you had to work with messy or incomplete data?',
      'Tell me about a time when you had to choose between model accuracy and interpretability.',
      'Describe a project where you had to collaborate closely with engineering to deploy a model.',
      'Tell me about a time when you discovered bias in your data or model. How did you address it?',
      'Can you describe a situation where you had to validate the business impact of your work?',
      'Tell me about a time when you had to learn a new statistical method or tool quickly.',
      'Describe a situation where you had to balance exploration with delivering results on time.',
      'Tell me about a time when you had to communicate uncertainty in your findings to decision-makers.'
    ]
  },
  technical: {
    'Software Engineer': [
      'How would you design a URL shortening service like bit.ly?',
      'Explain the difference between SQL and NoSQL databases. When would you use each?',
      'How would you implement a rate limiter for an API?',
      'What are the trade-offs between microservices and monolithic architecture?',
      'How would you design a chat application that supports millions of users?',
      'Explain how you would optimize a slow database query.',
      'How would you implement caching in a web application?',
      'What are the key considerations when designing a RESTful API?',
      'How would you handle authentication and authorization in a distributed system?',
      'Explain the concept of eventual consistency and when it\'s acceptable.'
    ],
    'Product Manager': [
      'How would you prioritize features for a mobile app with limited development resources?',
      'Walk me through how you would launch a new product in a competitive market.',
      'How would you measure the success of a feature that increases user engagement?',
      'Explain how you would conduct user research for a B2B product.',
      'How would you approach pricing strategy for a SaaS product?',
      'Walk me through your process for creating a product roadmap.',
      'How would you handle a situation where engineering says a feature will take 6 months but business wants it in 2?',
      'Explain how you would use A/B testing to validate a product hypothesis.',
      'How would you approach entering a new market with an existing product?',
      'Walk me through how you would sunset a product feature that users love but isn\'t profitable.'
    ],
    'Data Scientist': [
      'How would you approach building a recommendation system for an e-commerce platform?',
      'Explain the bias-variance tradeoff and how it affects model selection.',
      'How would you detect and handle outliers in a dataset?',
      'Walk me through your approach to feature engineering for a machine learning model.',
      'How would you evaluate the performance of a classification model with imbalanced classes?',
      'Explain how you would approach time series forecasting for business metrics.',
      'How would you design an A/B test to measure the impact of a new algorithm?',
      'Walk me through your process for model validation and preventing overfitting.',
      'How would you approach building a real-time fraud detection system?',
      'Explain how you would handle missing data in a machine learning pipeline.'
    ]
  },
  'case-study': {
    'Software Engineer': [
      'Our mobile app is experiencing slow load times. Walk me through how you would investigate and solve this.',
      'We need to migrate our monolithic application to microservices. How would you approach this?',
      'Our database is hitting performance limits. What strategies would you consider?',
      'We\'re seeing intermittent failures in our payment processing system. How would you debug this?',
      'Our API response times have increased by 200% after a recent deployment. How would you investigate?',
      'We need to implement real-time notifications for our web application. What\'s your approach?',
      'Our application needs to handle 10x more traffic during peak hours. How would you scale it?',
      'We\'re experiencing data inconsistencies between our services. How would you resolve this?',
      'Our CI/CD pipeline is taking too long and blocking deployments. How would you optimize it?',
      'We need to implement search functionality across multiple data types. What\'s your approach?'
    ],
    'Product Manager': [
      'Our user engagement has dropped 20% over the past quarter. How would you investigate and address this?',
      'We want to expand our product to a new geographic market. Walk me through your approach.',
      'Our main competitor just launched a feature that our users are requesting. How do you respond?',
      'We have limited engineering resources and 5 high-priority features. How do you prioritize?',
      'Our customer acquisition cost has increased while retention has decreased. What\'s your strategy?',
      'We\'re considering adding a premium tier to our freemium product. How would you approach this?',
      'User feedback indicates our onboarding process is confusing. How would you improve it?',
      'We need to sunset a feature that 30% of users actively use. How do you handle this?',
      'Our mobile app has a 2-star rating due to performance issues. What\'s your action plan?',
      'We want to integrate AI capabilities into our product. How do you evaluate and prioritize this?'
    ],
    'Data Scientist': [
      'Our recommendation engine is showing declining click-through rates. How would you investigate and improve it?',
      'We want to predict customer churn for our subscription service. Walk me through your approach.',
      'Our fraud detection model has high false positive rates. How would you optimize it?',
      'We need to forecast demand for our inventory management system. What\'s your methodology?',
      'Our A/B test results are inconclusive. How would you redesign the experiment?',
      'We want to personalize our marketing campaigns using customer data. How do you approach this?',
      'Our model performance has degraded over time in production. How do you diagnose and fix this?',
      'We need to explain our ML model decisions to regulators. How do you ensure interpretability?',
      'Our data pipeline is producing inconsistent results. How would you investigate and resolve this?',
      'We want to implement real-time scoring for our recommendation system. What are the challenges and solutions?'
    ]
  }
};

/**
 * Get a random mock resume analysis
 * @param {string} resumeText - Resume text (not used in mock)
 * @param {string} jobDescriptionText - Job description text (not used in mock)
 * @returns {Object} Mock analysis results
 */
export const getMockResumeAnalysis = (resumeText, jobDescriptionText) => {
  // Add some randomness to make it feel more realistic
  const baseAnalysis = MOCK_RESUME_ANALYSES[Math.floor(Math.random() * MOCK_RESUME_ANALYSES.length)];
  
  // Slightly randomize the match score
  const scoreVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
  const matchScore = Math.max(0, Math.min(100, baseAnalysis.matchScore + scoreVariation));
  
  // Add some job-description specific keywords if provided
  let missingKeywords = [...baseAnalysis.missingKeywords];
  if (jobDescriptionText) {
    const jobKeywords = extractKeywordsFromJobDescription(jobDescriptionText);
    missingKeywords = [...new Set([...missingKeywords, ...jobKeywords.slice(0, 3)])];
  }
  
  return {
    ...baseAnalysis,
    matchScore,
    missingKeywords: missingKeywords.slice(0, 8), // Limit to 8 keywords
    analysisId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Extract keywords from job description for more realistic mock responses
 * @param {string} jobDescription - Job description text
 * @returns {Array<string>} Extracted keywords
 */
const extractKeywordsFromJobDescription = (jobDescription) => {
  const commonTechKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue', 'Node.js',
    'Express', 'Django', 'Flask', 'Spring', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'GraphQL', 'REST', 'API', 'Microservices', 'CI/CD', 'Git', 'Agile',
    'Scrum', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science',
    'SQL', 'NoSQL', 'DevOps', 'Linux', 'TypeScript', 'HTML', 'CSS'
  ];
  
  const description = jobDescription.toLowerCase();
  const foundKeywords = commonTechKeywords.filter(keyword => 
    description.includes(keyword.toLowerCase())
  );
  
  // Return a random subset of found keywords
  return foundKeywords.sort(() => 0.5 - Math.random()).slice(0, 5);
};

/**
 * Get a mock interview question based on context
 * @param {string} role - Job role
 * @param {string} sessionType - Interview session type
 * @param {Array} history - Previous questions and answers
 * @returns {Object} Mock question response
 */
export const getMockInterviewQuestion = (role, sessionType, history = []) => {
  const sessionTypeKey = sessionType.toLowerCase().replace(' ', '-');
  const questions = MOCK_INTERVIEW_QUESTIONS[sessionTypeKey]?.[role] || 
                   MOCK_INTERVIEW_QUESTIONS.behavioral['Software Engineer'];
  
  // Filter out questions that have already been asked
  const askedQuestions = history.map(item => item.q || item.question);
  const availableQuestions = questions.filter(q => !askedQuestions.includes(q));
  
  // If all questions have been asked, start over with a different category
  let selectedQuestion;
  if (availableQuestions.length === 0) {
    // Try a different session type
    const fallbackTypes = Object.keys(MOCK_INTERVIEW_QUESTIONS);
    const fallbackType = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
    const fallbackQuestions = MOCK_INTERVIEW_QUESTIONS[fallbackType][role] || 
                             MOCK_INTERVIEW_QUESTIONS[fallbackType]['Software Engineer'];
    selectedQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  } else {
    selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }
  
  return {
    questionText: selectedQuestion,
    questionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: sessionType,
    role: role,
    timestamp: new Date().toISOString(),
    context: {
      totalQuestions: history.length + 1,
      sessionType,
      role,
    }
  };
};

/**
 * Simulate API delay for more realistic mock responses
 * @param {number} minMs - Minimum delay in milliseconds
 * @param {number} maxMs - Maximum delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
export const simulateApiDelay = (minMs = 1000, maxMs = 3000) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulate API errors for testing error handling
 * @param {number} errorRate - Error rate (0-1)
 * @param {Array} errorTypes - Types of errors to simulate
 * @param {Object} options - Additional options for error simulation
 * @returns {Error|null} Error object or null
 */
export const simulateApiError = (errorRate = 0.1, errorTypes = ['network', 'server', 'rate_limit'], options = {}) => {
  if (Math.random() > errorRate) {
    return null; // No error
  }
  
  const { testMode = false } = options;
  const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  
  switch (errorType) {
    case 'network':
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.code = 0;
      networkError.type = 'network_error';
      return networkError;
      
    case 'server':
      const serverError = new Error('Internal server error. Please try again later.');
      serverError.code = 500;
      serverError.type = 'server_error';
      return serverError;
      
    case 'rate_limit':
      const rateLimitError = new Error('Rate limit exceeded. Please wait before making another request.');
      rateLimitError.code = 429;
      rateLimitError.type = 'rate_limit_exceeded';
      // Use shorter reset time in test mode to avoid test timeouts
      rateLimitError.resetTime = testMode ? 1000 : 60000; // 1 second in test mode, 1 minute otherwise
      return rateLimitError;
      
    case 'timeout':
      const timeoutError = new Error('Request timeout. The service is taking too long to respond.');
      timeoutError.code = 408;
      timeoutError.type = 'timeout';
      return timeoutError;
      
    default:
      const unknownError = new Error('An unexpected error occurred.');
      unknownError.code = 500;
      unknownError.type = 'unknown_error';
      return unknownError;
  }
};

/**
 * Mock health check response
 * @returns {Object} Health check response
 */
export const getMockHealthCheck = () => {
  const isHealthy = Math.random() > 0.05; // 95% uptime
  
  return {
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: isHealthy ? 'up' : 'down',
      ai_model: isHealthy ? 'up' : 'degraded',
      cache: 'up',
    },
    metrics: {
      uptime: Math.floor(Math.random() * 1000000),
      requests_per_minute: Math.floor(Math.random() * 1000),
      average_response_time: Math.floor(Math.random() * 500) + 100,
    }
  };
};