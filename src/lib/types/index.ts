export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  bio: string | null;
  linkedin_url: string | null;
  onboarding_complete: boolean;
  rewards_points: number;
  created_at: string;
};

export type Flight = {
  id: string;
  user_id: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  seat: string | null;
  cabin_class: "economy" | "business" | "first";
  status: "upcoming" | "active" | "completed";
  created_at: string;
};

export type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  flight_id: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  profile?: UserProfile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: UserProfile;
};

export type Conversation = {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  participants?: UserProfile[];
  unread_count?: number;
};

export type Notification = {
  id: string;
  user_id: string;
  type: "connection_request" | "message" | "flight_match" | "reward";
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
};

export type Reward = {
  id: string;
  user_id: string;
  type: "connection" | "flight" | "referral" | "profile_complete";
  points: number;
  description: string;
  created_at: string;
};
