const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
];

export interface YouTubeInfo {
  videoId: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
}

/**
 * Parse a YouTube URL and extract video metadata.
 * Returns null if the URL is not a valid YouTube URL.
 */
export function parseYouTubeUrl(input: string): YouTubeInfo | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = input.match(pattern);
    if (match?.[1]) {
      const videoId = match[1];
      return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  }
  return null;
}

/**
 * Generate a privacy-enhanced YouTube embed URL.
 * Uses youtube-nocookie.com to avoid tracking cookies.
 */
export function privacyEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}