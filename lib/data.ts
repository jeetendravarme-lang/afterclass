import type { Friend, GalleryPhoto, SiteVideo } from './types';

// ---------------------------------------------------------------------------
// The 5 friends — The Last Bench Legends, BCA, Bundelkhand University, Jhansi.
// Instagram handles were confirmed from the user's own Instagram following list.
// ---------------------------------------------------------------------------
export const FRIENDS: Friend[] = [
  {
    id: 'jeetendra',
    name: 'Jeetendra',
    nickname: 'Musafir',
    photo: '/photos/1000221741_1_jsah.jpg',
    instagram: '@jeetendra_musafir',
    instagramUrl: 'https://www.instagram.com/jeetendra_musafir',
    caption: 'Nadi kinare, apni hi duniya mein.',
  },
  {
    id: 'aman',
    name: 'Aman',
    nickname: 'Genz',
    photo: '/photos/1000221739_2_6k5i.jpg',
    instagram: '@aman_kushwaha_6',
    instagramUrl: 'https://www.instagram.com/aman_kushwaha_6',
    caption: 'Park bench, halki si muskaan.',
  },
  {
    id: 'balveer',
    name: 'Balveer',
    nickname: 'Ballu',
    photo: '/photos/1000221737_3_hvtf.jpg',
    instagram: '@_thakur_balveer',
    instagramUrl: 'https://www.instagram.com/_thakur_balveer',
    caption: 'Thakur style, safed car ke saamne.',
  },
  {
    id: 'arjun',
    name: 'Arjun',
    nickname: 'Thakur Sahab',
    photo: '/photos/1000221735_4_r9ya.jpg',
    instagram: '@pvt_arjunnnnnn',
    instagramUrl: 'https://www.instagram.com/pvt_arjunnnnnn',
    caption: 'Thakur Sahab — hamesha style mein.',
  },
  {
    id: 'yash',
    name: 'Yash',
    nickname: 'Editor',
    photo: '/photos/1000221743_5_b7ip.jpg',
    instagram: '@yashuuuu___002',
    instagramUrl: 'https://www.instagram.com/yashuuuu___002',
    caption: 'Taj Mahal ke saamne, Editor mode on.',
  },
];

export const GROUP_NAME = 'The Last Bench Legends';

export const DEDICATION = {
  title: 'TO MY PEOPLE ❤️',
  subtitle: 'You Made My College Life Unforgettable.',
  hindi:
    'शायद हम हर दिन साथ न रहें, लेकिन तुम सब मेरी जिंदगी की उस कहानी का हिस्सा हो जिसे मैं कभी भूलना नहीं चाहूँगा।',
  footer: 'Forever Legends.',
};

export const WHEN_WE_WERE_TOGETHER = {
  title: 'WHEN WE WERE TOGETHER',
  subtitle: 'A Chapter We Never Wanted To End.',
  text: 'एक दिन हम सब अलग-अलग रास्तों पर होंगे। किसी को नौकरी मिलेगी, कोई आगे पढ़ेगा, कोई कहीं दूर चला जाएगा। लेकिन इस वेबसाइट में हमारी दोस्ती हमेशा जिंदा रहेगी।',
  footer: 'BCA Memories • Forever ❤️',
};

// Gallery: 12 verified real photos (5 portraits + 7 group photos).
// The original site had more photos; only these could be verified from the
// workspace, so only these are bundled. The gallery supports uploads, so the
// rest can be added from the site itself.
export const GALLERY: GalleryPhoto[] = [
  { src: '/photos/1000172069_18_a5hz.jpg', alt: 'Room group selfie — all 5 friends', album: 'Group Photos' },
  { src: '/photos/1000171963_19_b3g2.jpg', alt: 'Room fun selfie — 5 friends', album: 'Group Photos' },
  { src: '/photos/1000166854_20_gvop.jpg', alt: 'Stairs — formal, 4 friends', album: 'Group Photos' },
  { src: '/photos/1000166257_21_2zb9.jpg', alt: 'Auditorium — 4 friends', album: 'Group Photos' },
  { src: '/photos/1000166253_22_nj11.jpg', alt: 'Auditorium — 4 friends', album: 'Group Photos' },
  { src: '/photos/1000165815_23_hrb4.jpg', alt: 'Auditorium, black vest — 4 friends', album: 'Group Photos' },
  { src: '/photos/1000165303_24_gsj8.jpg', alt: 'Outdoor greenery — formal', album: 'Group Photos' },
  { src: '/photos/1000221741_1_jsah.jpg', alt: 'Jeetendra — river rocks', album: 'Portraits' },
  { src: '/photos/1000221739_2_6k5i.jpg', alt: 'Aman — park bench', album: 'Portraits' },
  { src: '/photos/1000221737_3_hvtf.jpg', alt: 'Balveer — white car', album: 'Portraits' },
  { src: '/photos/1000221735_4_r9ya.jpg', alt: 'Arjun — indoor', album: 'Portraits' },
  { src: '/photos/1000221743_5_b7ip.jpg', alt: 'Yash — Taj Mahal', album: 'Portraits' },
];

export const POSTER_SRC = '/photos/chhichhore-poster.jpg';

export const VIDEOS: SiteVideo[] = [
  {
    id: 'gang-dance',
    src: '/videos/gang-dance.mp4',
    title: 'Our Gang Dance — College Event',
    caption: 'Chaar kya 40 log bhi jitna itna nahi nach payenge jitna hum ek baar mein nachte hain',
    durationLabel: '0:20',
  },
  {
    id: 'birthday-cake',
    src: '/videos/birthday-cake.mp4',
    title: 'Birthday Cake Cutting',
    caption: 'Cake, hasi aur dosti — birthday special',
    durationLabel: '0:19',
  },
  {
    id: 'gang-clip-5s',
    src: '/videos/gang-clip-5s.mp4',
    title: 'Gang Clip',
    caption: '5 second ki yaadein',
    durationLabel: '0:05',
  },
  {
    id: 'classroom-candid',
    src: '/videos/classroom-candid.mp4',
    title: 'Classroom Candid',
    caption: 'Classroom ki candid masti',
    durationLabel: '0:04',
  },
  {
    id: 'auditorium-dance',
    src: '/videos/auditorium-dance.mp4',
    title: 'Auditorium Dance',
    caption: 'Auditorium stage par gang dance',
    durationLabel: '0:17',
  },
];

export const SONGS = [
  {
    id: 'fikar-not',
    title: 'Fikar Not',
    artist: 'Chhichhore (2019) • Pritam • T-Series',
    embed: 'https://www.youtube.com/embed/kBkvGyR_ykQ',
  },
  {
    id: 'yeh-dosti',
    title: 'Yeh Dosti Hum Nahi Todenge',
    artist: 'Sholay (1975)',
    embed: 'https://www.youtube.com/embed/Bx5sqAE86e0',
  },
];

// Memory Map seed — the ONLY pre-seeded pin. Everything else is user-added.
export const SEED_PLACE = {
  name: 'Bundelkhand University, Jhansi',
  lat: 25.45602,
  lng: 78.612,
};
