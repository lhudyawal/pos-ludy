import { createClient } from '@supabase/supabase-js';
import type { User } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface UserToSync {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'admin' | 'sales';
}

function mapClerkUserToSync(user: User): UserToSync {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown',
    email: user.emailAddresses?.[0]?.emailAddress || '',
    phone: user.phoneNumbers?.[0]?.phoneNumber || null,
    avatarUrl: user.imageUrl || null,
    role: (user.publicMetadata?.role as 'admin' | 'sales') || 'sales',
  };
}

async function syncUser(userData: UserToSync) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        avatar_url: userData.avatarUrl,
        is_active: true,
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single();

  if (error) {
    console.error(`Error syncing user ${userData.id}:`, error);
    return null;
  }

  console.log(`Synced user: ${userData.name} (${userData.email}) as ${userData.role}`);
  return data;
}

async function syncAllUsers() {
  console.log('Fetching users from Clerk...\n');

  try {
    const clerk = require('@clerk/clerk-sdk-node');
    const client = clerk.clerkClient || clerk;
    const response = await client.users.getUserList({ limit: 100 });
    
    const users: User[] = Array.isArray(response) ? response : (response.data ?? []);
    console.log(`Found ${users.length} users in Clerk\n`);

    const userDataList = users.map((user: User) => mapClerkUserToSync(user));

    const results = await Promise.all(
      userDataList.map((user: UserToSync) => syncUser(user))
    );

    const successCount = results.filter(Boolean).length;
    console.log(`\n✓ Synced ${successCount}/${users.length} users successfully`);
    
    return results.filter(Boolean);
  } catch (error) {
    console.error('Error fetching users from Clerk:', error);
    throw error;
  }
}

async function syncUserById(clerkUserId: string) {
  console.log(`Fetching user ${clerkUserId} from Clerk...`);

  try {
    const clerk = require('@clerk/clerk-sdk-node');
    const client = clerk.clerkClient || clerk;
    const user = await client.users.getUser(clerkUserId);
    
    const userData = mapClerkUserToSync(user);
    const result = await syncUser(userData);
    
    if (result) {
      console.log(`\n✓ Synced user successfully`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching user ${clerkUserId}:`, error);
    throw error;
  }
}

async function getOrCreateUser(clerkUserId: string) {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .single();

  if (existing) {
    return existing;
  }

  return syncUserById(clerkUserId);
}

async function updateUserRole(clerkUserId: string, role: 'admin' | 'sales') {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('clerk_id', clerkUserId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating role for ${clerkUserId}:`, error);
    return null;
  }

  console.log(`Updated role for ${clerkUserId} to ${role}`);
  return data;
}

async function deactivateUser(clerkUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('clerk_id', clerkUserId)
    .select()
    .single();

  if (error) {
    console.error(`Error deactivating ${clerkUserId}:`, error);
    return null;
  }

  console.log(`Deactivated user ${clerkUserId}`);
  return data;
}

export {
  syncUser,
  syncAllUsers,
  syncUserById,
  getOrCreateUser,
  updateUserRole,
  deactivateUser,
};

if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'all':
      syncAllUsers()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'user':
      if (!process.argv[3]) {
        console.error('Usage: npx tsx scripts/sync-clerk.ts user <clerk_user_id>');
        process.exit(1);
      }
      syncUserById(process.argv[3])
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log(`
Clerk User Sync Script

Usage:
  npx tsx scripts/sync-clerk.ts all          - Sync all users from Clerk
  npx tsx scripts/sync-clerk.ts user <id>   - Sync specific user by Clerk ID
      `);
  }
}
