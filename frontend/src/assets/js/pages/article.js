// /assets/js/pages/article.js
(function () {
  // Simple Markdown to HTML converter
  function parseMarkdown(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
    
    // Links

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    
    // Code blocks
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote><p>$1</p></blockquote>');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
      para = para.trim();
      if (para && !para.match(/^<[^>]+>/)) {
        return `<p>${para}</p>`;
      }
      return para;
    }).join('\n');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // Initialize AOS and icons
    window.AOS &&
      AOS.init({
        duration: 600,
        easing: "ease-out-cubic",
        once: true,
        offset: 40,
      });
    KUtils.refreshIcons();
    KUtils.buildFooterLinks();

    // Extract slug from URL
    const pathParts = window.location.pathname.split("/");
    const slug = pathParts[pathParts.length - 1];
    
    console.log("Path parts:", pathParts);
    console.log("Extracted slug:", slug);

    if (!slug || slug === "magazine") {
      console.error("No valid slug found");
      window.location.href = "/magazine";
      return;
    }

    try {
      // Fetch article data
      const apiUrl = `/api/magazine/posts/${slug}`;
      console.log("Fetching from:", apiUrl);
      
      const response = await fetch(apiUrl);
      console.log("Response status:", response.status);
      
      // Check if the response is 404 and redirect
      if (response.status === 404) {
        window.location.href = "/404";
        return;
      }
      
      const result = await response.json();
      console.log("API Response:", result);

      if (!response.ok || !result.success || !result.data) {
        // Redirect to 404 page instead of showing error
        window.location.href = "/404";
        return;
      }

      const article = result.data;

      // Update page title
      document.title = `${article.title} | مجله KOALAW`;

      // Update article content
      updateArticleContent(article);

      // Load related articles
      await loadRelatedArticles(article.related || []);

    } catch (error) {
      console.error("Error loading article:", error);
      // Redirect to 404 page on any error
      window.location.href = "/404";
    }
  });

  function formatPersianDate(dateString) {
    if (!dateString) return "تاریخ نامشخص";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Intl.DateTimeFormat("fa-IR", options).format(date);
  }

  function updateArticleContent(article) {
    // Update category
    const categoryDisplay =
      article.category === "GUIDE"
        ? "راهنما"
        : article.category === "TUTORIAL"
        ? "آموزش"
        : article.category === "LIFESTYLE"
        ? "لایف‌استایل"
        : article.category === "TRENDS"
        ? "ترندها"
        : "عمومی";

    const categoryLink = document.getElementById("article-category");
    if (categoryLink) {
      categoryLink.textContent = categoryDisplay;
      categoryLink.href = `/magazine?category=${article.category.toLowerCase()}`;
    }

    // Update title
    const titleElement = document.getElementById("article-title");
    if (titleElement) titleElement.textContent = article.title;

    // Update excerpt
    const excerptElement = document.getElementById("article-excerpt");
    if (excerptElement && article.excerpt) {
      excerptElement.textContent = article.excerpt;
    } else if (excerptElement) {
      // Create excerpt from content if not provided
      const plainText = article.content.replace(/[#*_`[```()]/g, '').substring(0, 150);
      excerptElement.textContent = plainText + "...";
    }

    // Update author info
    if (article.author) {
      const authorName = document.getElementById("author-name");
      if (authorName) authorName.textContent = article.author.name;

      const authorAvatar = document.getElementById("author-avatar");
      if (authorAvatar && article.author.avatarUrl) {
        authorAvatar.src = article.author.avatarUrl;
      }

      // Update author box at bottom
      const authorBoxName = document.getElementById("author-box-name");
      if (authorBoxName) authorBoxName.textContent = article.author.name;

      const authorBoxAvatar = document.getElementById("author-box-avatar");
      if (authorBoxAvatar && article.author.avatarUrl) {
        authorBoxAvatar.src = article.author.avatarUrl;
      }

      const authorBoxBio = document.getElementById("author-box-bio");
      if (authorBoxBio && article.author.bio) {
        authorBoxBio.textContent = article.author.bio;
      } else if (authorBoxBio) {
        authorBoxBio.textContent = "نویسنده مجله KOALAW";
      }
    }

    // Update date
    const dateElement = document.getElementById("article-date");
    if (dateElement) {
      dateElement.textContent = formatPersianDate(article.publishedAt || article.createdAt);
    }

    // Update read time
    const readTimeSpan = document.querySelector("#read-time span");
    if (readTimeSpan) {
      readTimeSpan.textContent = `${article.readTimeMinutes || 5} دقیقه مطالعه`;
    }

    // Update hero image
    const heroImage = document.getElementById("hero-image");
    if (heroImage && article.heroImageUrl) {
      heroImage.src = article.heroImageUrl;
      heroImage.alt = article.title;
    } else if (heroImage) {
      // Use a default image if none provided
      heroImage.src = "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=1200&auto=format&fit=crop";
    }

    // Update article content - PARSE MARKDOWN TO HTML
    const contentElement = document.getElementById("article-content");
    if (contentElement) {
      // Convert Markdown to HTML
      const htmlContent = parseMarkdown(article.content);
      contentElement.innerHTML = `<div class="prose prose-lg max-w-none">${htmlContent}</div>`;
    }

    // Update share links
    updateShareLinks(article);

    // Refresh feather icons
    KUtils.refreshIcons();
  }

  function updateShareLinks(article) {
    const currentUrl = window.location.href;
    const shareText = encodeURIComponent(article.title);

    // Twitter share
    const twitterLink = document.getElementById("share-twitter");
    if (twitterLink) {
      twitterLink.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(
        currentUrl
      )}`;
    }

    // Telegram share
    const telegramLink = document.getElementById("share-telegram");
    if (telegramLink) {
      telegramLink.href = `https://t.me/share/url?url=${encodeURIComponent(
        currentUrl
      )}&text=${shareText}`;
    }

    // Copy link
    const copyLink = document.getElementById("share-copy");
    if (copyLink) {
      copyLink.addEventListener("click", (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(currentUrl).then(() => {
          // Show a simple notification
          const originalHtml = copyLink.innerHTML;
          copyLink.innerHTML = '<i data-feather="check" class="w-4 h-4"></i>';
          KUtils.refreshIcons();
          setTimeout(() => {
            copyLink.innerHTML = originalHtml;
            KUtils.refreshIcons();
          }, 2000);
        });
      });
    }
  }

  async function loadRelatedArticles(relatedArticles) {
    const container = document.getElementById("related-articles");
    if (!container) return;

    // Clear loading state
    container.innerHTML = "";

    if (!relatedArticles || relatedArticles.length === 0) {
      // If no related articles, show a message
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-600">مقالات مرتبط دیگری وجود ندارد.</p>
        </div>`;
      return;
    }

    // Create cards for related articles
    relatedArticles.slice(0, 3).forEach((article, index) => {
      const card = createRelatedArticleCard(article, index);
      container.appendChild(card);
    });

    // Refresh AOS
    if (window.AOS && window.AOS.refreshHard) {
      window.AOS.refreshHard();
    }
    KUtils.refreshIcons();
  }

  function createRelatedArticleCard(article, index) {
    const categoryDisplay =
      article.category === "GUIDE"
        ? "راهنما"
        : article.category === "TUTORIAL"
        ? "آموزش"
        : article.category === "LIFESTYLE"
        ? "لایف‌استایل"
        : article.category === "TRENDS"
        ? "ترندها"
        : "عمومی";

    const readTime = article.readTimeMinutes || 5;
    const publishDate = article.publishedAt
      ? formatPersianDate(article.publishedAt)
      : "اخیراً";

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <a href="/magazine/${article.slug}" 
         class="group block rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white"
         data-aos="fade-up" data-aos-delay="${100 + index * 50}">
        <div class="relative h-64 overflow-hidden">
          <img src="${
            article.heroImageUrl ||
            "https://images.unsplash.com/photo-1590135824146-a79a3a16a443?q=80&w=800&auto=format&fit=crop"
          }" 
               alt="${article.title}" 
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 text-sm text-rose-600 font-semibold">
            <i data-feather="tag" class="w-4 h-4"></i><span>${categoryDisplay}</span>
          </div>
          <h3 class="mt-3 text-xl font-bold text-gray-800 leading-8 group-hover:text-rose-700 transition-colors">
            ${article.title}
          </h3>
          <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
            <span class="inline-flex items-center gap-1">
              <i data-feather="clock" class="w-4 h-4"></i>${readTime} دقیقه مطالعه
            </span>
            <span>${publishDate}</span>
          </div>
        </div>
      </a>`;

    return wrapper.firstElementChild;
  }
})();