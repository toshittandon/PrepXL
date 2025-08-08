/**
 * AI Services Usage Examples
 * 
 * This file demonstrates how to use the AI services in your application.
 * These examples can be used as reference for implementing AI features.
 */

import {
    analyzeResume,
    getInterviewQuestion,
    generateInterviewQuestions,
    initializeAiServices,
    getServiceStatus,
    isAiServiceAvailable,
    getServiceCapabilities,
} from './index.js';

/**
 * Example: Initialize AI services on application startup
 */
export const initializeAiServicesExample = async () => {
    console.log('🚀 Initializing AI services...');

    try {
        const result = await initializeAiServices();

        if (result.initialized) {
            console.log('✅ AI services ready!');
            console.log(`Mode: ${result.mockMode ? 'Mock' : 'Production'}`);

            // Get service capabilities
            const capabilities = getServiceCapabilities();
            console.log('📋 Available features:', capabilities);

            return true;
        } else {
            console.error('❌ AI services failed to initialize:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Initialization error:', error);
        return false;
    }
};

/**
 * Example: Analyze a resume against a job description
 */
export const resumeAnalysisExample = async () => {
    console.log('📄 Analyzing resume...');

    const resumeText = `
    John Doe
    Senior Software Engineer
    
    Experience:
    • 5+ years developing web applications using React, Node.js, and TypeScript
    • Led a team of 4 developers in building scalable microservices architecture
    • Implemented CI/CD pipelines using Docker and Kubernetes
    • Optimized database queries resulting in 40% performance improvement
    
    Skills:
    JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL,
    Docker, Kubernetes, AWS, Git, Agile, Scrum
    
    Education:
    Bachelor of Science in Computer Science
    University of Technology, 2018
  `;

    const jobDescription = `
    We are seeking a Senior Full Stack Developer to join our growing team.
    
    Requirements:
    • 5+ years of experience with React and Node.js
    • Experience with TypeScript and modern JavaScript
    • Knowledge of cloud platforms (AWS, Azure, or GCP)
    • Experience with containerization (Docker, Kubernetes)
    • Strong understanding of database design and optimization
    • Experience with Agile development methodologies
    • Leadership experience preferred
    
    Nice to have:
    • Experience with GraphQL
    • Knowledge of machine learning concepts
    • DevOps experience with CI/CD pipelines
  `;

    try {
        const analysis = await analyzeResume(resumeText, jobDescription);

        console.log('📊 Analysis Results:');
        console.log(`Match Score: ${analysis.matchScore}%`);
        console.log(`Missing Keywords: ${analysis.missingKeywords.join(', ')}`);
        console.log(`Action Verb Analysis: ${analysis.actionVerbAnalysis}`);
        console.log('Format Suggestions:');
        analysis.formatSuggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion}`);
        });

        return analysis;
    } catch (error) {
        console.error('❌ Resume analysis failed:', error.message);
        throw error;
    }
};

/**
 * Example: Conduct an AI-powered interview session
 */
export const interviewSessionExample = async () => {
    console.log('🎤 Starting interview session...');

    const role = 'Software Engineer';
    const sessionType = 'Behavioral';
    let history = [];

    try {
        // Get first question
        console.log('Getting first question...');
        const question1 = await getInterviewQuestion(role, sessionType, history);
        console.log(`Q1: ${question1.questionText}`);

        // Simulate user answer
        const answer1 = "I have 5 years of experience in software development, primarily working with React and Node.js. I'm passionate about creating efficient, scalable solutions and enjoy collaborating with cross-functional teams.";
        history.push({ q: question1.questionText, a: answer1 });

        // Get follow-up question
        console.log('\nGetting follow-up question...');
        const question2 = await getInterviewQuestion(role, sessionType, history);
        console.log(`Q2: ${question2.questionText}`);

        // Simulate another answer
        const answer2 = "In my previous role, I led the migration of a monolithic application to microservices. The biggest challenge was maintaining data consistency across services. I implemented event sourcing and CQRS patterns to solve this.";
        history.push({ q: question2.questionText, a: answer2 });

        // Get final question
        console.log('\nGetting final question...');
        const question3 = await getInterviewQuestion(role, sessionType, history);
        console.log(`Q3: ${question3.questionText}`);

        console.log('\n✅ Interview session completed!');
        console.log(`Total questions asked: ${history.length + 1}`);

        return {
            questions: [question1, question2, question3],
            history,
            sessionSummary: {
                role,
                sessionType,
                totalQuestions: 3,
                duration: 'simulated',
            }
        };
    } catch (error) {
        console.error('❌ Interview session failed:', error.message);
        throw error;
    }
};

/**
 * Example: Generate multiple questions for practice
 */
export const generatePracticeQuestionsExample = async () => {
    console.log('📚 Generating practice questions...');

    const role = 'Product Manager';
    const sessionType = 'Technical';
    const questionCount = 5;

    try {
        const result = await generateInterviewQuestions(role, sessionType, questionCount);

        console.log(`✅ Generated ${result.questions.length} questions for ${role} - ${sessionType}:`);
        result.questions.forEach((question, index) => {
            console.log(`\n${index + 1}. ${question.questionText}`);
            console.log(`   Difficulty: ${question.difficulty}`);
            console.log(`   Estimated Time: ${question.estimatedTime}s`);
        });

        return result;
    } catch (error) {
        console.error('❌ Question generation failed:', error.message);
        throw error;
    }
};

/**
 * Example: Check service health and status
 */
export const serviceHealthCheckExample = async () => {
    console.log('🔍 Checking AI service health...');

    try {
        // Check if service is available
        const isAvailable = await isAiServiceAvailable();
        console.log(`Service Available: ${isAvailable ? '✅' : '❌'}`);

        // Get detailed status
        const status = await getServiceStatus();
        console.log('📊 Service Status:');
        console.log(`  Overall Status: ${status.status}`);
        console.log(`  Health: ${status.health.status}`);
        console.log(`  Rate Limit: ${status.rateLimit.remaining}/${status.rateLimit.limit} remaining`);
        console.log(`  Mock Mode: ${status.config.config.mockMode}`);

        return status;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        throw error;
    }
};

/**
 * Example: Error handling and recovery
 */
export const errorHandlingExample = async () => {
    console.log('⚠️ Demonstrating error handling...');

    try {
        // This should fail validation
        await analyzeResume('', '');
    } catch (error) {
        console.log('✅ Caught validation error:', error.message);
        console.log('Error type:', error.type);
        console.log('User message:', error.userMessage);
    }

    try {
        // This should fail with invalid role
        await getInterviewQuestion('Invalid Role', 'Behavioral', []);
    } catch (error) {
        console.log('✅ Caught invalid role error:', error.message);
    }

    console.log('✅ Error handling working correctly!');
};

/**
 * Example: Complete workflow demonstration
 */
export const completeWorkflowExample = async () => {
    console.log('🔄 Running complete AI services workflow...');

    try {
        // 1. Initialize services
        console.log('\n1️⃣ Initializing services...');
        await initializeAiServicesExample();

        // 2. Check service health
        console.log('\n2️⃣ Checking service health...');
        await serviceHealthCheckExample();

        // 3. Analyze resume
        console.log('\n3️⃣ Analyzing resume...');
        const resumeAnalysis = await resumeAnalysisExample();

        // 4. Conduct interview
        console.log('\n4️⃣ Conducting interview...');
        const interviewSession = await interviewSessionExample();

        // 5. Generate practice questions
        console.log('\n5️⃣ Generating practice questions...');
        const practiceQuestions = await generatePracticeQuestionsExample();

        // 6. Demonstrate error handling
        console.log('\n6️⃣ Testing error handling...');
        await errorHandlingExample();

        console.log('\n🎉 Complete workflow finished successfully!');

        return {
            resumeAnalysis,
            interviewSession,
            practiceQuestions,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('❌ Workflow failed:', error.message);
        throw error;
    }
};

// Export all examples for easy testing
export const examples = {
    initializeAiServicesExample,
    resumeAnalysisExample,
    interviewSessionExample,
    generatePracticeQuestionsExample,
    serviceHealthCheckExample,
    errorHandlingExample,
    completeWorkflowExample,
};

// Auto-run complete workflow if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    completeWorkflowExample()
        .then(() => {
            console.log('✅ All examples completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Examples failed:', error);
            process.exit(1);
        });
}