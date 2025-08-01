const sdk = require('node-appwrite');

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a 500 response will be returned.
*/

module.exports = async (req, res) => {
  const client = new sdk.Client();

  // Initialize the Appwrite client
  client
    .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
    .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
    .setKey(req.variables['APPWRITE_FUNCTION_API_KEY']);

  const databases = new sdk.Databases(client);
  const storage = new sdk.Storage(client);

  try {
    // Parse the request payload
    const data = JSON.parse(req.payload || '{}');
    const { fileId, userId, resumeId } = data;

    if (!fileId || !userId || !resumeId) {
      return res.json({ 
        success: false, 
        error: 'Missing required parameters: fileId, userId, resumeId' 
      }, 400);
    }

    // Download the file from storage
    const fileBuffer = await storage.getFileDownload(
      req.variables['APPWRITE_STORAGE_BUCKET_ID'], 
      fileId
    );

    // Extract text from the file (simplified - you'd use proper text extraction libraries)
    let resumeText = '';
    
    // For now, we'll assume it's a text file or implement basic text extraction
    // In a real implementation, you'd use libraries like pdf-parse, mammoth, etc.
    resumeText = fileBuffer.toString('utf8');

    // Perform AI analysis (mock implementation)
    const analysisResults = await analyzeResume(resumeText);

    // Update the resume record in the database
    await databases.updateDocument(
      req.variables['APPWRITE_DATABASE_ID'],
      req.variables['APPWRITE_RESUMES_COLLECTION_ID'],
      resumeId,
      {
        status: 'analyzed',
        analyzedAt: new Date().toISOString()
      }
    );

    // Return the analysis results
    return res.json({
      success: true,
      data: {
        analysisResults,
        resumeId
      }
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Update resume status to failed if we have the resumeId
    try {
      const data = JSON.parse(req.payload || '{}');
      if (data.resumeId) {
        await databases.updateDocument(
          req.variables['APPWRITE_DATABASE_ID'],
          req.variables['APPWRITE_RESUMES_COLLECTION_ID'],
          data.resumeId,
          {
            status: 'failed',
            analyzedAt: new Date().toISOString()
          }
        );
      }
    } catch (updateError) {
      console.error('Failed to update resume status:', updateError);
    }

    return res.json({
      success: false,
      error: error.message || 'Resume analysis failed'
    }, 500);
  }
};

// Mock AI analysis function
async function analyzeResume(resumeText) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const text = resumeText.toLowerCase();
  
  // Extract keywords and analyze content
  const commonTechKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git'];
  const foundTechKeywords = commonTechKeywords.filter(keyword => text.includes(keyword));
  
  const commonActionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'optimized'];
  const foundActionVerbs = commonActionVerbs.filter(verb => text.includes(verb));

  return {
    atsKeywords: [
      ...foundTechKeywords.slice(0, 3),
      'project management',
      'team collaboration',
      'problem solving',
      'communication skills',
      'agile methodology'
    ].slice(0, 8),
    
    actionVerbs: [
      ...foundActionVerbs.slice(0, 4),
      'achieved',
      'collaborated',
      'delivered',
      'improved'
    ].slice(0, 6),
    
    quantificationSuggestions: [
      'Add specific metrics to your achievements (e.g., "increased efficiency by 25%")',
      'Include team size when mentioning leadership roles',
      'Quantify project scope and impact with numbers',
      'Specify timeframes for major accomplishments',
      'Add percentage improvements or cost savings where applicable',
      'Include user base size or system scale metrics'
    ],
    
    overallScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
    
    strengths: [
      'Strong technical skills alignment with job requirements',
      'Clear career progression demonstrated',
      'Good use of industry-relevant keywords',
      'Professional formatting and structure'
    ],
    
    improvements: [
      'Add more quantifiable achievements',
      'Include relevant certifications or training',
      'Optimize keyword density for ATS systems',
      'Consider adding a professional summary section'
    ],
    
    atsCompatibility: {
      score: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
      issues: [
        'Consider using standard section headings',
        'Ensure consistent date formatting',
        'Use common job title variations'
      ]
    }
  };
}