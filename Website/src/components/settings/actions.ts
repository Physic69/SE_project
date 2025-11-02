// src/components/settings/actions.ts

'use server'

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define a schema that includes all our form fields
const formSchema = z.object({
  display_name: z.string().min(1, "Name is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  bio: z.string().max(160, "Bio cannot be longer than 160 characters.").optional(),
  
  // Privacy settings
  profile_visibility: z.enum(['public', 'followers', 'private']),
  show_online_status: z.boolean(),
  allow_follow_requests: z.boolean(),
  // ... add other privacy fields if they are in the form
});


export async function updateProfile(formData: z.infer<typeof formSchema>) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  // 1. Update the 'profiles' table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: formData.display_name,
      username: formData.username,
      bio: formData.bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // 2. Update the 'privacy_settings' table
  const { error: privacyError } = await supabase
    .from('privacy_settings')
    .update({
      profile_visibility: formData.profile_visibility,
      show_online_status: formData.show_online_status,
      allow_follow_requests: formData.allow_follow_requests,
      updated_at: new Date().toISOString(),
      // ... add other privacy fields here
    })
    .eq('user_id', user.id);
  
  if (privacyError) {
    // If it fails, maybe the row doesn't exist? Try to insert it.
    const { error: insertError } = await supabase
      .from('privacy_settings')
      .insert({
        user_id: user.id,
        profile_visibility: formData.profile_visibility,
        show_online_status: formData.show_online_status,
        allow_follow_requests: formData.allow_follow_requests,
        // ... add other privacy fields here
      });
    if(insertError) return { error: insertError.message };
  }

  revalidatePath('/settings');
  return { error: null };
}