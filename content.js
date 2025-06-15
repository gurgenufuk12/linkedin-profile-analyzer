// content.js

function getProfileInfo() {
  console.log("LinkedIn Profil Analizci başlatıldı...");

  const result = {
    name: "Ad bulunamadı",
    connections: "Bağlantı sayısı bulunamadı",
    followers: "Takipçi sayısı bulunamadı",
    posts: [],
  };

  try {
    const nameSelectors = [
      "h1.text-heading-xlarge",
      "h1[data-generated-suggestion-target]",
      ".pv-text-details__left-panel h1",
      ".ph5.pb5 h1",
      "h1.inline.t-24.v-align-middle.break-words",
      '[data-anonymize="person-name"] h1',
      ".pv-top-card .pv-top-card__content h1",
    ];

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        result.name = element.textContent.trim();
        console.log("İsim bulundu:", result.name);
        break;
      }
    }

    const pageText = document.body.innerText;
    console.log("Sayfa metni uzunluğu:", pageText.length);

    const connectionPatterns = [
      /(500\+)\s*bağlantı/gi,
      /(\d{2,3}(?:[.,]\d{3})*)\s*bağlantı/gi,
      /(500\+)\s*connection/gi,
      /(\d{2,3}(?:[.,]\d{3})*)\s*connection/gi,
    ];

    const followerPatterns = [
      /(\d{1,3}(?:[.,]\d{3})*)\s*takipçi/gi,
      /(\d{1,3}(?:[.,]\d{3})*)\s*follower/gi,
    ];

    for (const pattern of connectionPatterns) {
      const matches = [...pageText.matchAll(pattern)];
      for (const match of matches) {
        const beforeMatch = pageText.substring(
          Math.max(0, match.index - 10),
          match.index
        );
        if (
          !beforeMatch.includes("derece") &&
          !beforeMatch.includes("degree") &&
          !beforeMatch.includes("1.") &&
          !beforeMatch.includes("2.")
        ) {
          const numberMatch = match[1];
          if (
            numberMatch &&
            (numberMatch === "500+" || parseInt(numberMatch) >= 10)
          ) {
            result.connections = numberMatch;
            console.log(
              "Bağlantı sayısı bulundu:",
              result.connections,
              "Tam metin:",
              match[0]
            );
            break;
          }
        }
      }
      if (result.connections !== "Bağlantı sayısı bulunamadı") break;
    }

    for (const pattern of followerPatterns) {
      const match = pageText.match(pattern);
      if (match && match[0]) {
        const numberMatch = match[0].match(/(\d{1,3}(?:[.,]\d{3})*)/);
        if (numberMatch) {
          result.followers = numberMatch[0];
          console.log("Takipçi sayısı bulundu:", result.followers);
          break;
        }
      }
    }

    const potentialElements = document.querySelectorAll("span, div, li, a");

    potentialElements.forEach((element) => {
      const text = element.textContent.trim().toLowerCase();

      if (text.length > 50) return;
      if (result.connections === "Bağlantı sayısı bulunamadı") {
        if (text.includes("bağlantı") || text.includes("connection")) {
          if (
            text.includes("derece") ||
            text.includes("degree") ||
            text.includes("1.") ||
            text.includes("2.") ||
            text.includes("3.") ||
            text.includes("1st") ||
            text.includes("2nd") ||
            text.includes("3rd")
          ) {
            return;
          }

          const numberMatch = text.match(/(\d{2,3}(?:[.,]\d{3})*|500\+)/);
          if (numberMatch) {
            const number = numberMatch[1];
            if (number === "500+" || parseInt(number) >= 10) {
              result.connections = number;
              console.log(
                "Element'te bağlantı bulundu:",
                text,
                "->",
                result.connections
              );
            }
          }
        }
      }
      if (result.followers === "Takipçi sayısı bulunamadı") {
        if (text.includes("takipçi") || text.includes("follower")) {
          const numberMatch = text.match(/(\d{1,3}(?:[.,]\d{3})*)/);
          if (numberMatch) {
            result.followers = numberMatch[0];
            console.log(
              "Element'te takipçi bulundu:",
              text,
              "->",
              result.followers
            );
          }
        }
      }
    });

    try {
      console.log("Faaliyet bölümü aranıyor...");

      const activitySectionSelectors = [
        '[data-generated-suggestion-target*="activity"]',
        'h2:contains("Faaliyet")',
        'h2:contains("Activity")',
        '.pvs-header__title:contains("Faaliyet")',
        '.pvs-header__title:contains("Activity")',
      ];

      let activitySection = null;

      const allHeadings = document.querySelectorAll(
        "h2, h3, .pvs-header__title, .t-20, .text-heading-large"
      );
      for (const heading of allHeadings) {
        const text = heading.textContent.trim().toLowerCase();
        if (text.includes("faaliyet") || text.includes("activity")) {
          activitySection =
            heading.closest("section") ||
            heading.closest("[data-view-name]") ||
            heading.parentElement;
          console.log("Faaliyet bölümü bulundu:", text);
          break;
        }
      }
      if (activitySection) {
        const postElements = activitySection.querySelectorAll(
          '[data-view-name*="profile-activity"], ' +
            ".feed-shared-update-v2, " +
            ".occludable-update, " +
            '[data-id*="activity"], ' +
            ".pvs-list__item, " +
            '[data-view-name="profile-activity-feed-item"], ' +
            ".feed-shared-update, " +
            "article, " +
            '[role="article"], ' +
            ".pvs-list .pvs-list__item, " +
            '[data-view-name*="post"], ' +
            ".update-components-update-v2, " +
            ".artdeco-card"
        );

        console.log(`${postElements.length} gönderi elementi bulundu`);

        if (postElements.length < 3) {
          console.log("Az gönderi bulundu, daha genel selectors deneniyor...");

          const allElements =
            activitySection.querySelectorAll("div, li, article");
          const additionalPosts = [];

          allElements.forEach((element) => {
            const text = element.textContent.trim();
            if (
              (text.includes("gün") ||
                text.includes("saat") ||
                text.includes("day") ||
                text.includes("hour")) &&
              text.length > 30 &&
              text.length < 1000 &&
              !additionalPosts.includes(element)
            ) {
              if (!Array.from(postElements).includes(element)) {
                additionalPosts.push(element);
                console.log(
                  "Ek gönderi bulundu:",
                  text.substring(0, 50) + "..."
                );
              }
            }
          });

          const combinedPosts = [
            ...Array.from(postElements),
            ...additionalPosts,
          ];
          console.log(
            `Toplam ${combinedPosts.length} gönderi bulundu (${postElements.length} standart + ${additionalPosts.length} ek)`
          );
          combinedPosts.forEach((postElement, index) => {
            if (result.posts.length >= 5) return;

            processPost(postElement, index, result);
          });
        } else {
          // Normal işlem
          postElements.forEach((postElement, index) => {
            if (result.posts.length >= 5) return;

            processPost(postElement, index, result);
          });
        }

        if (postElements.length === 0) {
          console.log(
            "Standart selectors ile gönderi bulunamadı, alternatif arama yapılıyor..."
          );

          const allDivs = activitySection.querySelectorAll("div");
          const potentialPosts = [];

          allDivs.forEach((div) => {
            const text = div.textContent;
            if (
              (text.includes("gün") ||
                text.includes("saat") ||
                text.includes("dakika")) &&
              text.length > 20 &&
              text.length < 500
            ) {
              potentialPosts.push(div);
            }
          });

          console.log(`${potentialPosts.length} potansiyel gönderi bulundu`);

          potentialPosts.forEach((postElement, index) => {
            if (result.posts.length >= 5) return;

            const post = {
              index: index + 1,
              content: "",
              timeAgo: "",
              likes: "",
              comments: "",
            };

            const fullText = postElement.textContent.trim();

            const timeMatch = fullText.match(
              /(\d+\s*(gün|saat|dakika|hafta|ay))/
            );
            if (timeMatch) {
              post.timeAgo = timeMatch[0];
            }

            let content = fullText;
            if (timeMatch) {
              const timeIndex = fullText.indexOf(timeMatch[0]);
              content = fullText
                .substring(timeIndex + timeMatch[0].length)
                .trim();
            }

            if (content.length > 20) {
              post.content =
                content.length > 200
                  ? content.substring(0, 200) + "..."
                  : content;
              result.posts.push(post);
              console.log(
                `Alternatif yöntemle gönderi ${index + 1} eklendi:`,
                post.timeAgo,
                post.content.substring(0, 50) + "..."
              );
            }
          });
        }

        postElements.forEach((postElement, index) => {
          if (result.posts.length >= 5) return;

          try {
            const post = {
              index: index + 1,
              content: "",
              timeAgo: "",
              likes: "",
              comments: "",
            };

            const contentSelectors = [
              ".feed-shared-text .break-words",
              ".feed-shared-text",
              ".feed-shared-update-v2__description",
              ".pvs-list__item .t-14",
              ".pvs-list__item .break-words",
              '[data-view-name="profile-activity-feed-item"] .break-words',
            ];

            for (const selector of contentSelectors) {
              const contentElement = postElement.querySelector(selector);
              if (contentElement && contentElement.textContent.trim()) {
                post.content = contentElement.textContent.trim();
                break;
              }
            }

            const timeSelectors = [
              ".feed-shared-actor__sub-description time",
              ".pvs-list__item time",
              ".feed-shared-actor__sub-description .t-12.t-black--light",
              ".feed-shared-actor__sub-description .t-12",
              ".feed-shared-actor time",
              '[data-view-name*="time"]',
              ".t-12.t-black--light",
              "time[datetime]",
            ];

            for (const selector of timeSelectors) {
              const timeElement = postElement.querySelector(selector);
              if (timeElement) {
                let timeText = timeElement.textContent.trim();
                const timePatterns = [
                  /\d+\s*(gün|saat|dakika|hafta|ay|yıl)/gi,
                  /\d+\s*(day|hour|minute|week|month|year)/gi,
                  /\d+[dhwmy]/gi,
                ];

                for (const pattern of timePatterns) {
                  const match = timeText.match(pattern);
                  if (match) {
                    post.timeAgo = match[0];
                    break;
                  }
                }

                const datetime = timeElement.getAttribute("datetime");
                if (datetime && !post.timeAgo) {
                  post.timeAgo = datetime;
                }
              }
            }

            if (!post.timeAgo) {
              const parentText = postElement.textContent;
              const sharePatterns = [/bunu paylaştı/gi, /shared this/gi];

              for (const pattern of sharePatterns) {
                if (parentText.match(pattern)) {
                  const timeMatch = parentText.match(
                    /\d+\s*(gün|saat|dakika|hafta|ay|yıl|day|hour|minute|week|month|year)/gi
                  );
                  if (timeMatch) {
                    post.timeAgo = timeMatch[0];
                    break;
                  }
                }
              }
            }

            const likeSelectors = [
              ".social-counts-reactions__count",
              '[data-test-id="social-action-like-count"]',
              ".feed-shared-social-action-bar__reaction-count",
            ];

            for (const selector of likeSelectors) {
              const likeElement = postElement.querySelector(selector);
              if (likeElement && likeElement.textContent.trim()) {
                post.likes = likeElement.textContent.trim();
                break;
              }
            }

            const commentSelectors = [
              ".social-counts-comments__count",
              '[data-test-id="social-action-comment-count"]',
              ".feed-shared-social-action-bar__comment-count",
            ];

            for (const selector of commentSelectors) {
              const commentElement = postElement.querySelector(selector);
              if (commentElement && commentElement.textContent.trim()) {
                post.comments = commentElement.textContent.trim();
                break;
              }
            }

            if (post.content && post.content.length > 10) {
              if (post.content.length > 200) {
                post.content = post.content.substring(0, 200) + "...";
              }

              result.posts.push(post);
              console.log(
                `Gönderi ${post.index} eklendi:`,
                post.content.substring(0, 50) + "...",
                "Zaman:",
                post.timeAgo
              );
            }
          } catch (postError) {
            console.error(`Gönderi ${index + 1} işlenirken hata:`, postError);
            if (postError && postError.message) {
              console.error("Hata mesajı:", postError.message);
            }
          }
        });
      }
    } catch (error) {
      console.log("Faaliyet bölümü işlenirken hata:", error);
    }
  } catch (activityError) {
    console.error("Faaliyet bölümü işlenirken hata:", activityError);
  }

  console.log("Nihai sonuç:", result);
  return result;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    const nameSelectors = [
      "h1.text-heading-xlarge",
      "h1[data-generated-suggestion-target]",
      ".pv-text-details__left-panel h1",
      ".ph5.pb5 h1",
      "h1.inline.t-24.v-align-middle.break-words",
      '[data-anonymize="person-name"] h1',
      ".pv-top-card .pv-top-card__content h1",
    ];

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        result.name = element.textContent.trim();
        console.log("İsim bulundu:", result.name);
        break;
      }
    }

    const pageText = document.body.innerText;
    console.log("Sayfa metni uzunluğu:", pageText.length);
    const connectionPatterns = [
      // Türkçe
      /(500\+)\s*bağlantı/gi,
      /(\d{2,3}(?:[.,]\d{3})*)\s*bağlantı/gi,
      // İngilizce
      /(500\+)\s*connection/gi,
      /(\d{2,3}(?:[.,]\d{3})*)\s*connection/gi,
    ];

    const followerPatterns = [
      // Türkçe
      /(\d{1,3}(?:[.,]\d{3})*)\s*takipçi/gi,
      // İngilizce
      /(\d{1,3}(?:[.,]\d{3})*)\s*follower/gi,
    ];

    for (const pattern of connectionPatterns) {
      const matches = [...pageText.matchAll(pattern)];
      for (const match of matches) {
        const beforeMatch = pageText.substring(
          Math.max(0, match.index - 10),
          match.index
        );
        if (
          !beforeMatch.includes("derece") &&
          !beforeMatch.includes("degree") &&
          !beforeMatch.includes("1.") &&
          !beforeMatch.includes("2.")
        ) {
          const numberMatch = match[1];
          if (
            numberMatch &&
            (numberMatch === "500+" || parseInt(numberMatch) >= 10)
          ) {
            result.connections = numberMatch;
            console.log(
              "Bağlantı sayısı bulundu:",
              result.connections,
              "Tam metin:",
              match[0]
            );
            break;
          }
        }
      }
      if (result.connections !== "Bağlantı sayısı bulunamadı") break;
    }

    for (const pattern of followerPatterns) {
      const match = pageText.match(pattern);
      if (match && match[0]) {
        const numberMatch = match[0].match(/(\d{1,3}(?:[.,]\d{3})*)/);
        if (numberMatch) {
          result.followers = numberMatch[0];
          console.log("Takipçi sayısı bulundu:", result.followers);
          break;
        }
      }
    }
    const potentialElements = document.querySelectorAll("span, div, li, a");

    potentialElements.forEach((element) => {
      const text = element.textContent.trim().toLowerCase();

      if (text.length > 50) return;
      if (result.connections === "Bağlantı sayısı bulunamadı") {
        if (text.includes("bağlantı") || text.includes("connection")) {
          if (
            text.includes("derece") ||
            text.includes("degree") ||
            text.includes("1.") ||
            text.includes("2.") ||
            text.includes("3.") ||
            text.includes("1st") ||
            text.includes("2nd") ||
            text.includes("3rd")
          ) {
            return;
          }

          const numberMatch = text.match(/(\d{2,3}(?:[.,]\d{3})*|500\+)/);
          if (numberMatch) {
            const number = numberMatch[1];
            if (number === "500+" || parseInt(number) >= 10) {
              result.connections = number;
              console.log(
                "Element'te bağlantı bulundu:",
                text,
                "->",
                result.connections
              );
            }
          }
        }
      }
      if (result.followers === "Takipçi sayısı bulunamadı") {
        if (text.includes("takipçi") || text.includes("follower")) {
          const numberMatch = text.match(/(\d{1,3}(?:[.,]\d{3})*)/);
          if (numberMatch) {
            result.followers = numberMatch[0];
            console.log(
              "Element'te takipçi bulundu:",
              text,
              "->",
              result.followers
            );
          }
        }
      }
    });

    try {
      console.log("Faaliyet bölümü aranıyor...");

      const activitySectionSelectors = [
        '[data-generated-suggestion-target*="activity"]',
        'h2:contains("Faaliyet")',
        'h2:contains("Activity")',
        '.pvs-header__title:contains("Faaliyet")',
        '.pvs-header__title:contains("Activity")',
      ];

      let activitySection = null;

      const allHeadings = document.querySelectorAll(
        "h2, h3, .pvs-header__title, .t-20, .text-heading-large"
      );
      for (const heading of allHeadings) {
        const text = heading.textContent.trim().toLowerCase();
        if (text.includes("faaliyet") || text.includes("activity")) {
          activitySection =
            heading.closest("section") ||
            heading.closest("[data-view-name]") ||
            heading.parentElement;
          console.log("Faaliyet bölümü bulundu:", text);
          break;
        }
      }
      if (activitySection) {
        const postElements = activitySection.querySelectorAll(
          '[data-view-name*="profile-activity"], ' +
            ".feed-shared-update-v2, " +
            ".occludable-update, " +
            '[data-id*="activity"], ' +
            ".pvs-list__item, " +
            '[data-view-name="profile-activity-feed-item"], ' +
            ".feed-shared-update, " +
            "article, " +
            '[role="article"], ' +
            ".pvs-list .pvs-list__item, " +
            '[data-view-name*="post"], ' +
            ".update-components-update-v2, " +
            ".artdeco-card"
        );

        console.log(`${postElements.length} gönderi elementi bulundu`);

        if (postElements.length < 3) {
          console.log("Az gönderi bulundu, daha genel selectors deneniyor...");

          const allElements =
            activitySection.querySelectorAll("div, li, article");
          const additionalPosts = [];

          allElements.forEach((element) => {
            const text = element.textContent.trim();
            if (
              (text.includes("gün") ||
                text.includes("saat") ||
                text.includes("day") ||
                text.includes("hour")) &&
              text.length > 30 &&
              text.length < 1000 &&
              !additionalPosts.includes(element)
            ) {
              if (!Array.from(postElements).includes(element)) {
                additionalPosts.push(element);
                console.log(
                  "Ek gönderi bulundu:",
                  text.substring(0, 50) + "..."
                );
              }
            }
          });

          const combinedPosts = [
            ...Array.from(postElements),
            ...additionalPosts,
          ];
          console.log(
            `Toplam ${combinedPosts.length} gönderi bulundu (${postElements.length} standart + ${additionalPosts.length} ek)`
          );
          combinedPosts.forEach((postElement, index) => {
            if (result.posts.length >= 5) return;

            processPost(postElement, index, result);
          });
        } else {
          // Normal işlem
          postElements.forEach((postElement, index) => {
            if (result.posts.length >= 5) return;

            processPost(postElement, index, result);
          });
        }

        if (postElements.length === 0) {
          console.log(
            "Standart selectors ile gönderi bulunamadı, alternatif arama yapılıyor..."
          );

          const allDivs = activitySection.querySelectorAll("div");
          const potentialPosts = [];

          allDivs.forEach((div) => {
            const text = div.textContent;
            if (
              (text.includes("gün") ||
                text.includes("saat") ||
                text.includes("dakika")) &&
              text.length > 20 &&
              text.length < 500
            ) {
              potentialPosts.push(div);
            }
          });

          console.log(`${potentialPosts.length} potansiyel gönderi bulundu`);

          potentialPosts.forEach((postElement, index) => {
            if (result.posts.length >= 5) return;

            const post = {
              index: index + 1,
              content: "",
              timeAgo: "",
              likes: "",
              comments: "",
            };

            const fullText = postElement.textContent.trim();

            const timeMatch = fullText.match(
              /(\d+\s*(gün|saat|dakika|hafta|ay))/
            );
            if (timeMatch) {
              post.timeAgo = timeMatch[0];
            }

            let content = fullText;
            if (timeMatch) {
              const timeIndex = fullText.indexOf(timeMatch[0]);
              content = fullText
                .substring(timeIndex + timeMatch[0].length)
                .trim();
            }

            if (content.length > 20) {
              post.content =
                content.length > 200
                  ? content.substring(0, 200) + "..."
                  : content;
              result.posts.push(post);
              console.log(
                `Alternatif yöntemle gönderi ${index + 1} eklendi:`,
                post.timeAgo,
                post.content.substring(0, 50) + "..."
              );
            }
          });
        }

        postElements.forEach((postElement, index) => {
          if (result.posts.length >= 5) return;

          try {
            const post = {
              index: index + 1,
              content: "",
              timeAgo: "",
              likes: "",
              comments: "",
            };

            const contentSelectors = [
              ".feed-shared-text .break-words",
              ".feed-shared-text",
              ".feed-shared-update-v2__description",
              ".pvs-list__item .t-14",
              ".pvs-list__item .break-words",
              '[data-view-name="profile-activity-feed-item"] .break-words',
            ];

            for (const selector of contentSelectors) {
              const contentElement = postElement.querySelector(selector);
              if (contentElement && contentElement.textContent.trim()) {
                post.content = contentElement.textContent.trim();
                break;
              }
            }

            const timeSelectors = [
              ".feed-shared-actor__sub-description time",
              ".pvs-list__item time",
              ".feed-shared-actor__sub-description .t-12.t-black--light",
              ".feed-shared-actor__sub-description .t-12",
              ".feed-shared-actor time",
              '[data-view-name*="time"]',
              ".t-12.t-black--light",
              "time[datetime]",
            ];

            for (const selector of timeSelectors) {
              const timeElement = postElement.querySelector(selector);
              if (timeElement) {
                let timeText = timeElement.textContent.trim();
                const timePatterns = [
                  /\d+\s*(gün|saat|dakika|hafta|ay|yıl)/gi,
                  /\d+\s*(day|hour|minute|week|month|year)/gi,
                  /\d+[dhwmy]/gi,
                ];

                for (const pattern of timePatterns) {
                  const match = timeText.match(pattern);
                  if (match) {
                    post.timeAgo = match[0];
                    break;
                  }
                }

                const datetime = timeElement.getAttribute("datetime");
                if (datetime && !post.timeAgo) {
                  post.timeAgo = datetime;
                }
              }
            }

            if (!post.timeAgo) {
              const parentText = postElement.textContent;
              const sharePatterns = [/bunu paylaştı/gi, /shared this/gi];

              for (const pattern of sharePatterns) {
                if (parentText.match(pattern)) {
                  const timeMatch = parentText.match(
                    /\d+\s*(gün|saat|dakika|hafta|ay|yıl|day|hour|minute|week|month|year)/gi
                  );
                  if (timeMatch) {
                    post.timeAgo = timeMatch[0];
                    break;
                  }
                }
              }
            }

            const likeSelectors = [
              ".social-counts-reactions__count",
              '[data-test-id="social-action-like-count"]',
              ".feed-shared-social-action-bar__reaction-count",
            ];

            for (const selector of likeSelectors) {
              const likeElement = postElement.querySelector(selector);
              if (likeElement && likeElement.textContent.trim()) {
                post.likes = likeElement.textContent.trim();
                break;
              }
            }

            const commentSelectors = [
              ".social-counts-comments__count",
              '[data-test-id="social-action-comment-count"]',
              ".feed-shared-social-action-bar__comment-count",
            ];

            for (const selector of commentSelectors) {
              const commentElement = postElement.querySelector(selector);
              if (commentElement && commentElement.textContent.trim()) {
                post.comments = commentElement.textContent.trim();
                break;
              }
            }

            if (post.content && post.content.length > 10) {
              if (post.content.length > 200) {
                post.content = post.content.substring(0, 200) + "...";
              }

              result.posts.push(post);
              console.log(
                `Gönderi ${post.index} eklendi:`,
                post.content.substring(0, 50) + "...",
                "Zaman:",
                post.timeAgo
              );
            }
          } catch (postError) {
            console.error(`Gönderi ${index + 1} işlenirken hata:`, postError);
            if (postError && postError.message) {
              console.error("Hata mesajı:", postError.message);
            }
          }
        });
      }
    } catch (error) {
      console.log("Faaliyet bölümü işlenirken hata:", error);
    }
  } catch (activityError) {
    console.error("Faaliyet bölümü işlenirken hata:", activityError);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProfileData") {
    console.log("Content script: getProfileData mesajı alındı.");
    try {
      const data = getProfileInfo();
      console.log("Content script: Veri gönderiliyor:", data);
      sendResponse({ status: "success", data: data });
    } catch (error) {
      console.error("Content script: Veri alınırken hata:", error);
      sendResponse({
        status: "error",
        message: error?.message || "Bilinmeyen hata",
      });
    }
    return true;
  }
});

console.log("LinkedIn Profil Analizci content script yüklendi.");

function processPost(postElement, index, result) {
  try {
    const post = {
      index: result.posts.length + 1,
      content: "",
      timeAgo: "",
      likes: "",
      comments: "",
    };

    const contentSelectors = [
      ".feed-shared-text .break-words",
      ".feed-shared-text",
      ".feed-shared-update-v2__description",
      ".pvs-list__item .t-14",
      ".pvs-list__item .break-words",
      '[data-view-name="profile-activity-feed-item"] .break-words',
      ".update-components-text",
      ".feed-shared-text__text-view",
    ];

    for (const selector of contentSelectors) {
      const contentElement = postElement.querySelector(selector);
      if (contentElement && contentElement.textContent.trim()) {
        post.content = contentElement.textContent.trim();
        break;
      }
    }

    const timeSelectors = [
      ".feed-shared-actor__sub-description time",
      ".pvs-list__item time",
      ".feed-shared-actor__sub-description .t-12.t-black--light",
      ".feed-shared-actor__sub-description .t-12",
      ".feed-shared-actor time",
      '[data-view-name*="time"]',
      ".t-12.t-black--light",
      "time[datetime]",
      ".update-components-actor__sub-description time",
    ];

    for (const selector of timeSelectors) {
      const timeElement = postElement.querySelector(selector);
      if (timeElement) {
        let timeText = timeElement.textContent.trim();
        const timePatterns = [
          /\d+\s*(gün|saat|dakika|hafta|ay|yıl)/gi,
          /\d+\s*(day|hour|minute|week|month|year)/gi,
          /\d+[dhwmy]/gi,
        ];

        for (const pattern of timePatterns) {
          const match = timeText.match(pattern);
          if (match) {
            post.timeAgo = match[0];
            break;
          }
        }

        const datetime = timeElement.getAttribute("datetime");
        if (datetime && !post.timeAgo) {
          post.timeAgo = datetime;
        }
      }
    }

    if (!post.timeAgo) {
      const parentText = postElement.textContent;
      const timePatterns = [
        /\d+\s*(gün|saat|dakika|hafta|ay|yıl)/gi,
        /\d+\s*(day|hour|minute|week|month|year)/gi,
        /\d+[dhwmy]/gi,
      ];

      for (const pattern of timePatterns) {
        const match = parentText.match(pattern);
        if (match) {
          post.timeAgo = match[0];
          break;
        }
      }
    }

    const normalizedContent = post.content.toLowerCase().trim();
    const normalizedTimeAgo = post.timeAgo.toLowerCase().trim();

    const isDuplicate = result.posts.some(
      (existingPost) =>
        existingPost.content.toLowerCase().trim() === normalizedContent &&
        existingPost.timeAgo.toLowerCase().trim() === normalizedTimeAgo
    );

    if (!isDuplicate && post.content && post.content.length > 10) {
      if (post.content.length > 200) {
        post.content = post.content.substring(0, 200) + "...";
      }

      result.posts.push(post);
      console.log(
        `Gönderi ${result.posts.length} eklendi:`,
        post.content.substring(0, 50) + "...",
        "Zaman:",
        post.timeAgo
      );
    } else if (isDuplicate) {
      console.log(
        "Duplicate gönderi atlandı:",
        post.content.substring(0, 50) + "..."
      );
    }
  } catch (postError) {
    console.error(`Gönderi ${index + 1} işlenirken hata:`, postError);
  }
}
