import { useEffect, useState } from "react";
import { safeJsonParse } from "@/utils/request";
import { Link } from "react-router-dom";
import PlaceholderOne from "@/media/announcements/placeholder-1.png";
import PlaceholderTwo from "@/media/announcements/placeholder-2.png";
import PlaceholderThree from "@/media/announcements/placeholder-3.png";
import { useTranslation } from "react-i18next";

/**
 * @typedef {Object} NewsItem
 * @property {string} title
 * @property {string|null} thumbnail_url
 * @property {string} short_description
 * @property {string|null} goto
 * @property {string|null} source
 * @property {string|null} date
 */

const NEWS_CACHE_CONFIG = {
  articles: "/assets/announcements/list.txt",
  announcementsDir: "/assets/announcements",
  cacheKey: "anythingllm_announcements",
  ttl: 0, // disable cache for testing
};

const PLACEHOLDERS = [PlaceholderOne, PlaceholderTwo, PlaceholderThree];

function randomPlaceholder() {
  return PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
}

export default function Updates() {
  const { t } = useTranslation();
  const { isLoading, news } = useNewsItems();
  if (isLoading || !news?.length) return null;

  return (
    <div>
      <h1 className="text-theme-home-text uppercase text-sm font-semibold mb-4">
        {t("main-page.announcements.title")}
      </h1>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item, index) => (
          <AnnouncementCard
            key={index}
            thumbnail_url={item.thumbnail_url}
            title={item.title}
            subtitle={item.short_description}
            source={item.source}
            date={item.date}
            goto={item.goto}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Check if a URL is external or local HTML
 */
function isExternal(goto) {
  if (!goto) return false;
  try {
    const url = new URL(goto, window.location.origin);
    return url.origin !== window.location.origin;
  } catch (e) {
    console.error("Invalid URL:", goto, e);
    return false;
  }
}

function AnnouncementCard({
  thumbnail_url = null,
  title = "",
  subtitle = "",
  author = "Talk2-Me",
  date = null,
  goto = "#",
}) {
  const placeHolderImage = randomPlaceholder();
  const isExternalLink = isExternal(goto);
  const isLocalHtml = goto.endsWith(".html");

  // Open local HTML pages and external links in a new tab
  const target = isExternalLink || isLocalHtml ? "_blank" : "_self";

  // Use <a> for external/local HTML, <Link> for internal React routes
  const Wrapper = isExternalLink || isLocalHtml ? "a" : Link;

  return (
    <Wrapper
      {...(Wrapper === "a" ? { href: goto } : { to: goto })}
      target={target}
      rel="noopener noreferrer"
      className="block"
    >
      <div className="bg-theme-home-update-card-bg rounded-xl p-4 flex gap-x-4 hover:bg-theme-home-update-card-hover transition-colors">
        <img
          src={thumbnail_url ?? placeHolderImage}
          alt={title}
          loading="lazy"
          onError={(e) => (e.target.src = placeHolderImage)}
          className="w-[80px] h-[80px] rounded-lg flex-shrink-0 object-cover"
        />
        <div className="flex flex-col gap-y-1">
          <h3 className="text-theme-home-text font-medium text-sm">{title}</h3>
          <p className="text-theme-home-text-secondary text-xs line-clamp-2">
            {subtitle}
          </p>
          <div className="flex items-center gap-x-4 text-xs text-theme-home-text-secondary">
            <span className="text-theme-home-update-source">{author}</span>
            <span>{date ?? "Recently"}</span>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

/**
 * Get cached news from localStorage if it exists and is valid by ttl timestamp
 */
function getCachedNews() {
  try {
    const cachedNews = localStorage.getItem(NEWS_CACHE_CONFIG.cacheKey);
    if (!cachedNews) return null;

    const parsedNews = safeJsonParse(cachedNews, null);
    if (!parsedNews || !parsedNews?.news?.length || !parsedNews.timestamp)
      return null;

    const now = new Date();
    const cacheExpiration = new Date(
      parsedNews.timestamp + NEWS_CACHE_CONFIG.ttl
    );
    if (now < cacheExpiration) return parsedNews.news;
    return null;
  } catch (error) {
    console.error("Error fetching cached news:", error);
    return null;
  }
}

/**
 * Fetch news from remote source and cache it in localStorage
 */
async function fetchRemoteNews() {
  try {
    const latestArticleDateRef = await fetch(NEWS_CACHE_CONFIG.articles)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `${res.status} - Failed to fetch remote news from ${NEWS_CACHE_CONFIG.articles}`
          );
        return res.text();
      })
      .then((text) => text?.split("\n")?.shift()?.trim())
      .catch((err) => {
        console.error(err.message);
        return null;
      });
    if (!latestArticleDateRef) return null;

    const dataURL = `${NEWS_CACHE_CONFIG.announcementsDir}/${latestArticleDateRef}${latestArticleDateRef.endsWith(".json") ? "" : ".json"}`;
    const announcementData = await fetch(dataURL)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `${res.status} - Failed to fetch remote news from ${dataURL}`
          );
        return res.json();
      })
      .catch((err) => {
        console.error(err.message);
        return [];
      });

    if (!announcementData?.length) return null;
    localStorage.setItem(
      NEWS_CACHE_CONFIG.cacheKey,
      JSON.stringify({
        news: announcementData,
        timestamp: Date.now(),
      })
    );

    return announcementData;
  } catch (error) {
    console.error("Error fetching remote news:", error);
    return null;
  }
}

/**
 * Hook to manage news state
 */
function useNewsItems() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const cachedNews = getCachedNews();
        if (cachedNews) return setNews(cachedNews);

        const remoteNews = await fetchRemoteNews();
        if (remoteNews) return setNews(remoteNews);
      } catch (error) {
        console.error("Error fetching cached news:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  return { news, isLoading };
}

