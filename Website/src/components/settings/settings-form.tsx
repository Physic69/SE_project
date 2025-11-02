// src/components/settings/settings-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "./actions";
import type { UserProfile, PrivacySettings } from "@/lib/types";
import { Lock, Globe, Users, Check, X } from "lucide-react";

// This schema now includes fields from BOTH tables
const formSchema = z.object({
  display_name: z.string().min(1, "Name is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  bio: z.string().max(160, "Bio cannot be longer than 160 characters.").optional(),
  
  profile_visibility: z.enum(['public', 'followers', 'private']),
  show_online_status: z.boolean().default(true),
  allow_follow_requests: z.boolean().default(true),
  // Add other privacy fields here as you build the form
});

type FormValues = z.infer<typeof formSchema>;

function SettingItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center p-4 border rounded-lg">
      <p className="text-sm font-medium">{label}</p>
      <div className="text-sm text-muted-foreground">{value}</div>
    </div>
  );
}

export function SettingsForm({ profile, privacySettings }: { profile: UserProfile; privacySettings: PrivacySettings }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: profile.display_name || "",
      username: profile.username || "",
      bio: profile.bio || "",
      profile_visibility: privacySettings.profile_visibility || 'public',
      show_online_status: privacySettings.show_online_status,
      allow_follow_requests: privacySettings.allow_follow_requests,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Success", description: "Your settings have been saved." });
        setIsEditing(false); // Go back to view mode
      }
    });
  };

  // --- VIEW MODE ---
  if (!isEditing) {
    const visibilityMap = {
        public: <><Globe className="h-4 w-4 mr-2"/>Public</>,
        followers: <><Users className="h-4 w-4 mr-2"/>Followers Only</>,
        private: <><Lock className="h-4 w-4 mr-2"/>Private</>
    }
    const booleanMap = {
        true: <><Check className="h-4 w-4 mr-2 text-green-500"/>Allowed</>,
        false: <><X className="h-4 w-4 mr-2 text-red-500"/>Not Allowed</>
    }

    return (
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Profile & Privacy</CardTitle>
              <CardDescription>Your current settings. Click edit to make changes.</CardDescription>
            </div>
            <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold">Profile</h3>
            <SettingItem label="Name" value={profile.display_name} />
            <SettingItem label="Username" value={profile.username} />
            <SettingItem label="Bio" value={profile.bio || "Not set"} />
            <h3 className="font-semibold pt-4">Privacy</h3>
            <SettingItem label="Profile Visibility" value={<span className="flex items-center">{visibilityMap[privacySettings.profile_visibility]}</span>} />
            <SettingItem label="Show Online Status" value={<span className="flex items-center">{booleanMap[privacySettings.show_online_status.toString()]}</span>} />
            <SettingItem label="Allow Follow Requests" value={<span className="flex items-center">{booleanMap[privacySettings.allow_follow_requests.toString()]}</span>} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- EDIT MODE ---
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField name="display_name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
            <FormField name="username" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
            <FormField name="bio" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem> )} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField name="profile_visibility" control={form.control} render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Profile Visibility</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="public" /></FormControl><FormLabel>Public</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="followers" /></FormControl><FormLabel>Followers Only</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="private" /></FormControl><FormLabel>Private</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}/>
            <FormField name="show_online_status" control={form.control} render={({ field }) => ( <FormItem className="flex items-center justify-between rounded-lg border p-4"><div><FormLabel>Show Online Status</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
            <FormField name="allow_follow_requests" control={form.control} render={({ field }) => ( <FormItem className="flex items-center justify-between rounded-lg border p-4"><div><FormLabel>Allow Follow Requests</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
          </CardContent>
        </Card>
        
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
          <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </form>
    </Form>
  );
}