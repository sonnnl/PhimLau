// 🛡️ AUTO-MODERATION UTILITIES
// Hệ thống tự động phát hiện và xử lý nội dung vi phạm trong forum

/**
 * ============================================================================
 * 🔥 CONFIGURATION - DANH SÁCH TỪ KHÓA VI PHẠM
 * ============================================================================
 * Có thể được load từ database hoặc config file trong tương lai
 */

// Danh sách từ khóa nhạy cảm (có thể mở rộng)
const BANNED_WORDS = [
  // 🚫 Từ ngữ tục tĩu tiếng Việt (Level: HIGH) - ĐÃ NORMALIZE
  "du", // đụ
  "dit", // địt
  "lon", // lồn
  "cac", // cặc
  "buoi", // buồi
  "di", // đĩ
  "cave",
  "gai goi", // gái gọi

  // ⚔️ Từ ngữ kích động bạo lực (Level: HIGH) - ĐÃ NORMALIZE
  "giet", // giết
  "chet di", // chết đi
  "tu tu", // tự tử
  "dot", // đốt
  "pha hoai", // phá hoại
  "bom",
  "khung bo", // khủng bố

  // 🎭 Từ ngữ phân biệt chủng tộc (Level: HIGH) - ĐÃ NORMALIZE
  "tau khua", // tàu khựa
  "khi den", // khỉ đen
  "moi ro", // mọi rợ
  "dan toc thieu so", // dân tộc thiểu số

  // 💰 Spam keywords (Level: MEDIUM) - ĐÃ NORMALIZE
  "ban hang", // bán hàng
  "kiem tien", // kiếm tiền
  "lam giau", // làm giàu
  "dau tu", // đầu tư
  "forex",
  "crypto",
  "MLM",
  "ban thuoc", // bán thuốc
  "ban duoc", // bán dược
  "quang cao", // quảng cáo

  // 🔞 Nội dung người lớn (Level: HIGH) - ĐÃ NORMALIZE
  "sex",
  "porn",
  "xxx",
  "18+",
  "phim nguoi lon", // phim người lớn
];

// 🤖 Patterns spam phổ biến với trọng số rủi ro
const SPAM_PATTERNS = [
  { pattern: /\b\d{10,11}\b/g, weight: 15, description: "Số điện thoại" },
  { pattern: /\b\w+@\w+\.\w+\b/g, weight: 10, description: "Email" },
  { pattern: /\bhttp[s]?:\/\/\S+/g, weight: 20, description: "URL/Link" },
  {
    pattern: /\b(zalo|telegram|facebook|fb|viber|skype|whatsapp)\b/gi,
    weight: 12,
    description: "App liên lạc",
  },
  {
    pattern: /[!@#$%^&*]{3,}/g,
    weight: 8,
    description: "Ký tự đặc biệt liên tục",
  },
  { pattern: /(.)\1{4,}/g, weight: 5, description: "Lặp ký tự" },
  {
    pattern: /\b(mua|bán|giá|tiền|vnđ|usd)\b/gi,
    weight: 7,
    description: "Từ khóa thương mại",
  },
];

/**
 * ============================================================================
 * 🎯 CORE ANALYSIS FUNCTIONS
 * ============================================================================
 */

/**
 * 🔍 FUNCTION: Kiểm tra nội dung có chứa từ ngữ nhạy cảm không
 * @param {string} content - Nội dung cần kiểm tra
 * @returns {Object} Kết quả phân tích profanity
 *
 * @logic WORKFLOW:
 * 1. Normalize text (bỏ dấu, lowercase)
 * 2. Check từng banned word
 * 3. Tính severity dựa trên số lượng vi phạm
 * 4. Return analysis result
 */
export const checkProfanity = (content) => {
  // 🔧 NORMALIZE - Chuẩn hóa text để tăng độ chính xác
  const normalizedContent = content
    .toLowerCase()
    .normalize("NFD") // Tách các ký tự có dấu
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ") // Thay thế ký tự đặc biệt
    .replace(/\s+/g, " "); // Normalize spaces

  const violatedWords = [];
  const violationPositions = []; // Track vị trí vi phạm để highlight

  // 🔍 SCAN - Quét từng banned word
  for (const word of BANNED_WORDS) {
    const normalizedWord = word.toLowerCase();
    const wordIndex = normalizedContent.indexOf(normalizedWord);

    if (wordIndex !== -1) {
      violatedWords.push(word);
      violationPositions.push({
        word: word,
        position: wordIndex,
        originalWord: content.substr(wordIndex, word.length),
      });
    }
  }

  // 📊 SEVERITY CALCULATION - Tính mức độ nghiêm trọng
  let severity = "low";
  let riskScore = 0;

  if (violatedWords.length > 3) {
    severity = "critical";
    riskScore = 100; // Auto-reject
  } else if (violatedWords.length > 1) {
    severity = "high";
    riskScore = 80;
  } else if (violatedWords.length > 0) {
    severity = "medium";
    riskScore = 50;
  }

  return {
    isViolation: violatedWords.length > 0,
    violatedWords,
    violationPositions,
    severity,
    riskScore,
    totalViolations: violatedWords.length,
  };
};

/**
 * 🕵️ FUNCTION: Kiểm tra nội dung có dấu hiệu spam không
 * @param {string} content - Nội dung cần kiểm tra
 * @returns {Object} Kết quả phân tích spam
 *
 * @logic WORKFLOW:
 * 1. Check spam patterns với trọng số
 * 2. Analyze content structure (length, caps, repetition)
 * 3. Calculate total risk score
 * 4. Determine spam classification
 */
export const checkSpam = (content) => {
  const spamIndicators = [];
  let riskScore = 0;
  const analysisDetails = [];

  // 🔍 PATTERN SCANNING - Quét các pattern spam
  for (const { pattern, weight, description } of SPAM_PATTERNS) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const score = matches.length * weight;
      spamIndicators.push(description);
      riskScore += score;

      analysisDetails.push({
        type: description,
        matches: matches.length,
        score: score,
        examples: matches.slice(0, 3), // Lấy max 3 ví dụ
      });
    }
  }

  // 📏 CONTENT LENGTH ANALYSIS - Phân tích độ dài
  if (content.length < 10) {
    spamIndicators.push("Nội dung quá ngắn");
    riskScore += 15;
    analysisDetails.push({
      type: "short_content",
      score: 15,
      details: `Độ dài: ${content.length} ký tự`,
    });
  }

  // 📢 CAPS ANALYSIS - Phân tích chữ hoa
  const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
  const upperCaseRatio = upperCaseCount / content.length;

  if (upperCaseRatio > 0.7 && content.length > 10) {
    spamIndicators.push("Quá nhiều chữ hoa");
    riskScore += 20;
    analysisDetails.push({
      type: "excessive_caps",
      score: 20,
      details: `Tỷ lệ chữ hoa: ${(upperCaseRatio * 100).toFixed(1)}%`,
    });
  }

  // 🔄 WORD REPETITION ANALYSIS - Phân tích lặp từ
  const words = content
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const wordCount = {};

  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }

  const repeatedWords = Object.entries(wordCount).filter(
    ([word, count]) => count > 3
  );

  if (repeatedWords.length > 0) {
    const score = repeatedWords.length * 10;
    spamIndicators.push("Lặp từ khóa");
    riskScore += score;
    analysisDetails.push({
      type: "repeated_words",
      score: score,
      details: repeatedWords.map(([word, count]) => `"${word}": ${count} lần`),
    });
  }

  // 🎯 SPAM CLASSIFICATION - Phân loại mức độ spam
  let spamLevel = "low";
  if (riskScore > 50) {
    spamLevel = "high";
  } else if (riskScore > 30) {
    spamLevel = "medium";
  }

  return {
    isSpam: riskScore > 30,
    spamLevel,
    spamIndicators,
    riskScore,
    analysisDetails,
    recommendation:
      riskScore > 50 ? "reject" : riskScore > 30 ? "review" : "approve",
  };
};

/**
 * ============================================================================
 * 🎯 COMPREHENSIVE CONTENT ANALYSIS
 * ============================================================================
 */

/**
 * 🤖 FUNCTION: Phân tích nội dung toàn diện (Content Analysis Engine)
 * @param {string} titleOrContent - Title (cho thread) hoặc content (cho reply)
 * @param {string} content - Content (optional, chỉ dùng cho thread)
 * @returns {Object} Kết quả phân tích chi tiết
 *
 * @logic WORKFLOW:
 * 1. Prepare and normalize content
 * 2. Check profanity violations
 * 3. Analyze spam patterns
 * 4. Calculate overall risk score
 * 5. Generate recommendations
 */
export const analyzeContent = (titleOrContent, content = null) => {
  // 📝 PREPARE CONTENT - Xử lý content linh hoạt
  let fullContent = "";
  let isThreadAnalysis = content !== null;

  if (isThreadAnalysis) {
    // Thread analysis: có cả title và content
    fullContent = `${titleOrContent} ${content}`.trim();
    console.log("🔍 Starting THREAD analysis:", {
      titleLength: titleOrContent?.length || 0,
      contentLength: content?.length || 0,
      totalLength: fullContent.length,
    });
  } else {
    // Reply analysis: chỉ có content
    fullContent = titleOrContent?.trim() || "";
    console.log("🔍 Starting REPLY analysis:", {
      contentLength: fullContent.length,
    });
  }

  // 🔥 PROFANITY ANALYSIS - Kiểm tra từ ngữ vi phạm
  const profanityCheck = checkProfanity(fullContent);
  console.log("🚫 Profanity check result:", {
    violations: profanityCheck.totalViolations,
    severity: profanityCheck.severity,
    score: profanityCheck.riskScore,
  });

  // 🕵️ SPAM ANALYSIS - Kiểm tra spam
  const spamCheck = checkSpam(fullContent);
  console.log("📧 Spam check result:", {
    isSpam: spamCheck.isSpam,
    level: spamCheck.spamLevel,
    score: spamCheck.riskScore,
  });

  // 📊 OVERALL RISK CALCULATION - Tính toán rủi ro tổng thể
  const combinedScore = profanityCheck.riskScore + spamCheck.riskScore;
  let overallRisk = "low";
  let shouldReject = false;
  let shouldFlag = false;

  // 🚨 DECISION LOGIC - Logic quyết định
  if (profanityCheck.severity === "critical" || combinedScore > 80) {
    overallRisk = "critical";
    shouldReject = true;
  } else if (profanityCheck.severity === "high" || combinedScore > 60) {
    overallRisk = "high";
    shouldFlag = true;
  } else if (profanityCheck.severity === "medium" || combinedScore > 30) {
    overallRisk = "medium";
    shouldFlag = true;
  }

  // 📋 GENERATE RECOMMENDATIONS - Tạo khuyến nghị
  const recommendations = {
    action: shouldReject ? "reject" : shouldFlag ? "review" : "approve",
    reason: shouldReject
      ? "Nội dung chứa từ ngữ không phù hợp nghiêm trọng hoặc spam"
      : shouldFlag
      ? "Nội dung cần được xem xét do có dấu hiệu vi phạm"
      : "Nội dung được chấp nhận",
    confidence:
      combinedScore > 60 ? "high" : combinedScore > 30 ? "medium" : "low",
    suggestedActions: shouldReject
      ? ["Từ chối bài viết", "Gửi thông báo cho user", "Ghi log vi phạm"]
      : shouldFlag
      ? ["Đưa vào hàng đợi kiểm duyệt", "Thông báo cho moderator"]
      : ["Phê duyệt tự động", "Đăng bài ngay lập tức"],
  };

  console.log("🎯 Final analysis result:", {
    type: isThreadAnalysis ? "THREAD" : "REPLY",
    overallRisk,
    combinedScore,
    action: recommendations.action,
  });

  return {
    profanity: profanityCheck,
    spam: spamCheck,
    overallRisk,
    combinedScore,
    shouldReject,
    shouldFlag,
    recommendations,
    analysisMetadata: {
      analyzedAt: new Date(),
      contentLength: fullContent.length,
      isThreadAnalysis,
      processingTime: Date.now(),
    },
  };
};

/**
 * ============================================================================
 * 🎯 MODERATION ACTION SUGGESTION
 * ============================================================================
 */

/**
 * 🤖 FUNCTION: Đề xuất hành động moderation dựa trên user profile và content analysis
 * @param {Object} user - Thông tin user
 * @param {Object} contentAnalysis - Kết quả phân tích nội dung
 * @param {string} contentType - "thread" hoặc "reply" để áp dụng logic khác nhau
 * @returns {string} Hành động đề xuất: "approve", "review", "reject"
 *
 * @logic DECISION TREE:
 * 1. Check user role (admin/moderator = auto approve)
 * 2. Check content severity (critical = auto reject)
 * 3. Apply different rules for thread vs reply
 * 4. Consider user trust level + content risk
 */
export const suggestModerationAction = (
  user,
  contentAnalysis,
  contentType = "thread"
) => {
  const { overallRisk, shouldReject, combinedScore } = contentAnalysis;

  console.log(
    `🤖 Suggesting moderation action for ${contentType.toUpperCase()}:`,
    {
      userRole: user.role,
      trustLevel: user.trustLevel,
      overallRisk,
      combinedScore,
    }
  );

  // 👑 ADMIN/MODERATOR BYPASS - Admin và Moderator được approve ngay
  if (user.role === "admin" || user.role === "moderator") {
    console.log("👑 Auto-approve: Admin/Moderator bypass");
    return "approve";
  }

  // 🚫 CRITICAL CONTENT REJECTION - Nội dung vi phạm nghiêm trọng → reject
  if (shouldReject || combinedScore > 80) {
    console.log("🚫 Auto-reject: Critical content violation");
    return "reject";
  }

  // 📊 USER REPUTATION CHECK - Kiểm tra danh tiếng user
  const userStats = user.forumStats || {};
  const postsCount = userStats.postsCount || 0;
  const reportsReceived = userStats.reportsReceived || 0;
  const likesReceived = userStats.likesReceived || 0;

  // 🚨 BAD REPUTATION - User có lịch sử xấu → review ngay cả với nội dung ok
  if (
    reportsReceived > 3 ||
    (postsCount > 5 && reportsReceived > postsCount * 0.3)
  ) {
    console.log("🚨 Force review: Bad user reputation");
    return contentType === "reply" ? "reject" : "review"; // Reply từ chối luôn, thread review
  }

  // ===============================
  // 🧵 THREAD MODERATION LOGIC
  // ===============================
  if (contentType === "thread") {
    console.log("🧵 Applying THREAD moderation logic");

    // 🏆 TRUSTED USER LOGIC - Logic cho user tin cậy
    if (user.trustLevel === "trusted" || user.autoApprovalEnabled) {
      if (overallRisk === "low" || combinedScore < 20) {
        console.log("🏆 Thread approved: Trusted user + safe content");
        return "approve";
      } else {
        console.log("🔍 Thread review: Trusted user + risky content");
        return "review";
      }
    }

    // 🆕 NEW USER LOGIC - User mới PHẢI kiểm duyệt thread
    if (user.trustLevel === "new" || postsCount < 5) {
      console.log("🆕 Thread review: New user (all threads require approval)");
      return "review"; // User mới luôn phải qua kiểm duyệt thread
    }

    // 📝 BASIC USER LOGIC - Logic cho user thường
    if (user.trustLevel === "basic" || (postsCount >= 5 && postsCount < 15)) {
      if (overallRisk === "low" && combinedScore < 10) {
        console.log("📝 Thread approved: Basic user + very safe content");
        return "approve";
      } else {
        console.log("🔍 Thread review: Basic user + questionable content");
        return "review";
      }
    }

    // 📊 REGULAR USER LOGIC - Logic cho user bình thường
    if (overallRisk === "low" && combinedScore < 15) {
      console.log("📊 Thread approved: Regular user + safe content");
      return "approve";
    }

    console.log("🔍 Thread review: Default case");
    return "review";
  }

  // ===============================
  // 💬 REPLY MODERATION LOGIC
  // ===============================
  if (contentType === "reply") {
    console.log("💬 Applying REPLY moderation logic");

    // 💬 REPLY PHILOSOPHY:
    // - Approve hầu hết replies để UX mượt mà
    // - Chỉ reject những reply có vấn đề rõ ràng
    // - Không có pending/review cho reply

    // 🚫 PROFANITY VIOLATIONS - Reject reply có từ tục tỉu
    if (
      contentAnalysis.profanity.isViolation &&
      contentAnalysis.profanity.totalViolations > 0
    ) {
      console.log("❌ Reply rejected: Contains profanity");
      return "reject";
    }

    // 🔥 HIGH RISK CONTENT - Reject reply có risk cao
    if (overallRisk === "high" || combinedScore > 50) {
      console.log("❌ Reply rejected: High risk content");
      return "reject";
    }

    // ✅ AUTO-APPROVE ALL OTHER CASES - Approve tất cả trường hợp còn lại
    console.log("✅ Reply approved: Safe content (default for replies)");
    return "approve";
  }

  // 🔍 DEFAULT FALLBACK
  console.log("🔍 Default review: Unknown content type");
  return "review";
};

/**
 * ============================================================================
 * 🧹 CONTENT CLEANING UTILITIES
 * ============================================================================
 */

/**
 * 🧹 FUNCTION: Lọc và làm sạch nội dung (Content Sanitization)
 * @param {string} content - Nội dung gốc
 * @returns {string} Nội dung đã được làm sạch
 *
 * @logic WORKFLOW:
 * 1. Replace banned words với dấu *
 * 2. Remove/mask URLs, emails, phone numbers
 * 3. Clean excessive special characters
 * 4. Return sanitized content
 */
export const cleanContent = (content) => {
  let cleanedContent = content;

  console.log("🧹 Starting content cleaning process");

  // 🚫 REPLACE BANNED WORDS - Thay thế từ ngữ nhạy cảm
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(word, "gi");
    const replacement = "*".repeat(word.length);
    cleanedContent = cleanedContent.replace(regex, replacement);
  }

  // 🔗 REMOVE LINKS - Loại bỏ các link
  cleanedContent = cleanedContent.replace(
    /\bhttp[s]?:\/\/\S+/g,
    "[LINK_REMOVED]"
  );

  // 📱 REMOVE PHONE NUMBERS - Loại bỏ số điện thoại
  cleanedContent = cleanedContent.replace(/\b\d{10,11}\b/g, "[PHONE_REMOVED]");

  // 📧 REMOVE EMAILS - Loại bỏ email
  cleanedContent = cleanedContent.replace(
    /\b\w+@\w+\.\w+\b/g,
    "[EMAIL_REMOVED]"
  );

  // 🎭 REMOVE EXCESSIVE SPECIAL CHARS - Loại bỏ ký tự đặc biệt thừa
  cleanedContent = cleanedContent.replace(/[!@#$%^&*]{3,}/g, "***");

  // 🔄 REMOVE EXCESSIVE REPETITION - Loại bỏ lặp ký tự
  cleanedContent = cleanedContent.replace(/(.)\1{4,}/g, "$1$1$1");

  console.log("🧹 Content cleaning completed");

  return cleanedContent.trim();
};

/**
 * ============================================================================
 * 📊 ANALYTICS & REPORTING
 * ============================================================================
 */

/**
 * 📈 FUNCTION: Tạo báo cáo phân tích chi tiết
 * @param {Object} analysis - Kết quả phân tích
 * @returns {Object} Báo cáo chi tiết
 */
export const generateAnalysisReport = (analysis) => {
  return {
    summary: {
      overallRisk: analysis.overallRisk,
      action: analysis.recommendations.action,
      confidence: analysis.recommendations.confidence,
      totalScore: analysis.combinedScore,
    },
    profanityDetails: {
      violationsFound: analysis.profanity.totalViolations,
      severity: analysis.profanity.severity,
      violatedWords: analysis.profanity.violatedWords,
    },
    spamDetails: {
      isSpam: analysis.spam.isSpam,
      spamLevel: analysis.spam.spamLevel,
      indicators: analysis.spam.spamIndicators,
      riskScore: analysis.spam.riskScore,
    },
    recommendations: analysis.recommendations,
    metadata: analysis.analysisMetadata,
  };
};
