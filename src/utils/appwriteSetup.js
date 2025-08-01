import { databases, storage, appwriteConfig } from '../services/appwrite/config.js';

/**
 * Test Appwrite connection and setup
 */
export const testAppwriteConnection = async () => {
  try {
    console.log('🔄 Testing Appwrite connection...');
    console.log('📋 Configuration:', {
      endpoint: appwriteConfig.endpoint,
      projectId: appwriteConfig.projectId,
      databaseId: appwriteConfig.databaseId,
    });

    let dbResult = null;
    let storageResult = null;

    // Test database connection by trying to access individual collections
    console.log('🔄 Testing database connection...');
    try {
      // Try to list collections using the correct method
      dbResult = await databases.listCollections(appwriteConfig.databaseId);
      console.log('✅ Database connected successfully');
      console.log('📊 Collections found:', dbResult.collections.map(c => ({ id: c.$id, name: c.name })));
    } catch (dbError) {
      console.log('⚠️ Database listCollections failed, trying individual collection access...');
      
      // If listCollections fails, try to access individual collections
      const collections = [];
      const requiredCollections = [
        { id: appwriteConfig.collections.resumes, name: 'resumes' },
        { id: appwriteConfig.collections.sessions, name: 'sessions' },
        { id: appwriteConfig.collections.interactions, name: 'interactions' },
      ];

      for (const collection of requiredCollections) {
        try {
          // Try to list documents from each collection (with limit 0 to just test access)
          await databases.listDocuments(appwriteConfig.databaseId, collection.id, [], 0);
          collections.push({ $id: collection.id, name: collection.name });
          console.log(`✅ Collection '${collection.name}' (${collection.id}) exists`);
        } catch (collectionError) {
          console.log(`❌ Collection '${collection.name}' (${collection.id}) NOT FOUND or not accessible`);
        }
      }
      
      dbResult = { collections };
      console.log('✅ Database connection test completed');
    }

    // Test storage connection
    console.log('🔄 Testing storage connection...');
    try {
      storageResult = await storage.listBuckets();
      console.log('✅ Storage connected successfully');
      console.log('🗂️ Buckets found:', storageResult.buckets.map(b => ({ id: b.$id, name: b.name })));
    } catch (storageError) {
      console.log('⚠️ Storage listBuckets failed, trying individual bucket access...');
      
      // Try to access the specific bucket
      try {
        const bucket = await storage.getBucket(appwriteConfig.storage.resumesBucket);
        storageResult = { buckets: [{ $id: bucket.$id, name: bucket.name }] };
        console.log(`✅ Storage bucket (${appwriteConfig.storage.resumesBucket}) exists`);
      } catch (bucketError) {
        console.log(`❌ Storage bucket (${appwriteConfig.storage.resumesBucket}) NOT FOUND`);
        storageResult = { buckets: [] };
      }
    }

    // Check if required collections exist (if we got them from listCollections)
    if (dbResult && dbResult.collections && dbResult.collections.length > 0) {
      const requiredCollections = [
        { id: appwriteConfig.collections.resumes, name: 'resumes' },
        { id: appwriteConfig.collections.sessions, name: 'sessions' },
        { id: appwriteConfig.collections.interactions, name: 'interactions' },
      ];

      console.log('🔄 Checking required collections...');
      for (const collection of requiredCollections) {
        const exists = dbResult.collections.find(c => c.$id === collection.id);
        if (exists) {
          console.log(`✅ Collection '${collection.name}' (${collection.id}) exists`);
        } else {
          console.log(`❌ Collection '${collection.name}' (${collection.id}) NOT FOUND`);
        }
      }
    }

    // Check if storage bucket exists (if we got them from listBuckets)
    if (storageResult && storageResult.buckets && storageResult.buckets.length > 0) {
      console.log('🔄 Checking storage bucket...');
      const bucketExists = storageResult.buckets.find(b => b.$id === appwriteConfig.storage.resumesBucket);
      if (bucketExists) {
        console.log(`✅ Storage bucket (${appwriteConfig.storage.resumesBucket}) exists`);
      } else {
        console.log(`❌ Storage bucket (${appwriteConfig.storage.resumesBucket}) NOT FOUND`);
      }
    }

    return {
      success: true,
      message: 'Appwrite connection test completed',
      collections: dbResult?.collections || [],
      buckets: storageResult?.buckets || [],
    };

  } catch (error) {
    console.error('❌ Appwrite connection failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Appwrite connection test failed',
    };
  }
};

/**
 * Instructions for setting up Appwrite collections
 */
export const getSetupInstructions = () => {
  return {
    database: {
      id: appwriteConfig.databaseId,
      name: 'InterviewPrep Database'
    },
    collections: [
      {
        id: appwriteConfig.collections.resumes,
        name: 'resumes',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'fileId', type: 'string', size: 255, required: true },
          { key: 'fileName', type: 'string', size: 255, required: true },
          { key: 'status', type: 'string', size: 50, required: true },
          { key: 'uploadedAt', type: 'string', size: 50, required: false },
        ]
      },
      {
        id: appwriteConfig.collections.sessions,
        name: 'sessions',
        attributes: [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'status', type: 'string', size: 50, required: true },
          { key: 'type', type: 'string', size: 100, required: false },
          { key: 'createdAt', type: 'string', size: 50, required: false },
        ]
      },
      {
        id: appwriteConfig.collections.interactions,
        name: 'interactions',
        attributes: [
          { key: 'sessionId', type: 'string', size: 255, required: true },
          { key: 'type', type: 'string', size: 100, required: true },
          { key: 'content', type: 'string', size: 10000, required: false },
          { key: 'order', type: 'integer', required: false },
        ]
      }
    ],
    storage: {
      id: appwriteConfig.storage.resumesBucket,
      name: 'resumes',
      permissions: ['read("any")', 'write("users")']
    }
  };
};

/**
 * Print setup instructions to console
 */
export const printSetupInstructions = () => {
  const instructions = getSetupInstructions();
  
  console.log('\n📋 APPWRITE SETUP INSTRUCTIONS');
  console.log('================================');
  
  console.log('\n1. DATABASE:');
  console.log(`   ID: ${instructions.database.id}`);
  console.log(`   Name: ${instructions.database.name}`);
  
  console.log('\n2. COLLECTIONS TO CREATE:');
  instructions.collections.forEach((collection, index) => {
    console.log(`\n   ${index + 1}. Collection: ${collection.name}`);
    console.log(`      ID: ${collection.id}`);
    console.log('      Attributes:');
    collection.attributes.forEach(attr => {
      console.log(`        - ${attr.key} (${attr.type}${attr.size ? `, size: ${attr.size}` : ''}${attr.required ? ', required' : ', optional'})`);
    });
  });
  
  console.log('\n3. STORAGE BUCKET:');
  console.log(`   ID: ${instructions.storage.id}`);
  console.log(`   Name: ${instructions.storage.name}`);
  console.log(`   Permissions: ${instructions.storage.permissions.join(', ')}`);
  
  console.log('\n4. NEXT STEPS:');
  console.log('   - Go to your Appwrite Console');
  console.log('   - Create the database and collections with the exact IDs and attributes listed above');
  console.log('   - Create the storage bucket with the specified ID');
  console.log('   - Run testAppwriteConnection() to verify setup');
};