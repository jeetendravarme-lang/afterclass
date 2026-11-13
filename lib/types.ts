export type Friend = {
  id: string;
  name: string;
  nickname: string;
  photo: string;
  instagram: string;
  instagramUrl: string;
  caption: string;
};

export type GalleryPhoto = {
  src: string;
  alt: string;
  album: string;
};

export type SiteVideo = {
  id: string;
  src: string;
  title: string;
  caption: string;
  durationLabel: string;
};

export type ChatMessage = {
  id: string;
  room: string;
  sender_id: string | null;
  sender_name: string;
  body: string;
  reply_to: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  edited_at: string | null;
  deleted: boolean;
};

export type Reaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
};

export type Connection = {
  id: string;
  user_a: string;
  user_b: string;
};

export type Birthday = {
  id: string;
  friend_name: string;
  month: number;
  day: number;
};

export type Wish = {
  id: string;
  friend_name: string;
  author: string;
  message: string;
  created_at: string;
};

export type MemoryPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  photo_url: string | null;
};

export type Poll = {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  created_by: string;
};

export type Quiz = {
  id: string;
  title: string;
  questions: { question: string; options: string[]; answer: number }[];
};

export type Challenge = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
};

export type CapsuleMessage = {
  id: string;
  author: string;
  body: string | null;
  locked: boolean;
  unlock_date: string;
};

export type CallHistoryRow = {
  id: string;
  room: string;
  caller: string;
  participants: string[];
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};
