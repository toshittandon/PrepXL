/**
 * Appwrite Collections Setup Script
 * This script will help you create the required collections for your app
 */

import { Client, Databases, Permission, Role } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68989b9a002cd7dd5c63');

const databases = new Databases(client);
const databaseId = '68989eb20006e65fe65f';

// Collection definitions
const collections = [
  {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'experienceLevel', type: 'string', size: 50, required: true },
      { key: 'targetRole', type: 'string', size: 255, required: false },
      { key: 'targetIndustry', type: 'string', size: 255, required: false },
      { key: 'isAdmin', type: 'boolean', required: false, default: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ]
  },
  {
    id: 'resumes',
    name: 'Resumes',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'fileId', type: 'string', size: 255, required: true },
      { key: 'fileName', type: 'string', size: 255, required: true },
      { key: 'jobDescription', type: 'string', size: 10000, required: true },
      { key: 'analysisResults', type: 'string', size: 50000, required: false },
      { key: 'uploadedAt', type: 'datetime', required: true }
    ]
  },
  {
    id: 'interview-sessions',
    name: 'Interview Sessions',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'sessionType', type: 'string', size: 50, required: true },
      { key: 'role', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'finalScore', type: 'integer', required: false, default: 0 },
      { key: 'startedAt', type: 'datetime', required: true },
      { key: 'completedAt', type: 'datetime', required: false }
    ]
  },
  {
    id: 'interactions',
    name: 'Interactions',
    attributes: [
      { key: 'sessionId', type: 'string', size: 255, required: true },
      { key: 'questionText', type: 'string', size: 5000, required: true },
      { key: 'userAnswerText', type: 'string', size: 10000, required: true },
      { key: 'timestamp', type: 'datetime', required: true },
      { key: 'order', type: 'integer', required: true }
    ]
  },
  {
    id: 'questions',
    name: 'Questions',
    attributes: [
      { key: 'questionText', type: 'string', size: 5000, required: true },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'role', type: 'string', size: 255, required: true },
      { key: 'suggestedAnswer', type: 'string', size: 10000, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ]
  }
];

async function setupCollections() {
  console.log('🚀 Setting up Appwrite collections...\n');

  try {
    // First, check what collections already exist
    console.log('1. Checking existing collections...');
    const existingCollections = await databases.listCollections(databaseId);
    const existingIds = existingCollections.collections.map(c => c.$id);
    
    console.log(`Found ${existingCollections.collections.length} existing collections:`);
    existingCollections.collections.forEach(col => {
      console.log(`   - ${col.name} (${col.$id})`);
    });

    // Create missing collections
    for (const collection of collections) {
      console.log(`\n2. Processing collection: ${collection.name}`);
      
      if (existingIds.includes(collection.id)) {
        console.log(`✅ Collection "${collection.name}" already exists`);
        continue;
      }

      try {
        console.log(`📝 Creating collection "${collection.name}"...`);
        
        // Create collection with basic permissions
        const newCollection = await databases.createCollection(
          databaseId,
          collection.id,
          collection.name,
          [
            Permission.create(Role.users()),
            Permission.read(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        
        console.log(`✅ Created collection: ${newCollection.name}`);
        
        // Add attributes
        console.log(`📋 Adding attributes to ${collection.name}...`);
        for (const attr of collection.attributes) {
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.size,
                attr.required,
                attr.default || null
              );
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                null, // min
                null, // max
                attr.default || null
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                attr.default || null
              );
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(
                databaseId,
                collection.id,
                attr.key,
                attr.required,
                attr.default || null
              );
            }
            
            console.log(`   ✅ Added attribute: ${attr.key} (${attr.type})`);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (attrError) {
            console.log(`   ⚠️ Attribute ${attr.key} might already exist: ${attrError.message}`);
          }
        }
        
      } catch (collectionError) {
        console.log(`❌ Failed to create collection ${collection.name}:`, collectionError.message);
      }
    }

    console.log('\n🎉 Collection setup complete!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Try registering a new user');
    console.log('3. Check the browser console for any remaining errors');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nManual setup required:');
    console.log('1. Go to https://cloud.appwrite.io');
    console.log('2. Navigate to your project and database');
    console.log('3. Create the collections manually using the Appwrite Console');
  }
}

setupCollections();