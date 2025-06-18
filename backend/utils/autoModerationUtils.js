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
  "loz", // loz
  "suc vat",
  "oc cho",
  "con me may",

  // ⚔️ Từ ngữ kích động bạo lực (Level: HIGH) - ĐÃ NORMALIZE
  "giet", // giết
  "chet di", // chết đi
  "tu tu", // tự tử
  "dot", // đốt
  "pha hoai", // phá hoại
  "bom",
  "khung bo", // khủng bố
  "cong san",

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
  "call show",
  "check hang",

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
 * @function checkProfanity
 * @description Kiểm tra nội dung có chứa từ ngữ nhạy cảm trong danh sách BANNED_WORDS không.
 *
 * @param {string} content - Chuỗi văn bản cần được kiểm tra.
 *
 * @returns {Object} Một đối tượng chứa kết quả phân tích, bao gồm:
 * - `isViolation` (boolean): True nếu phát hiện vi phạm.
 * - `violatedWords` (Array<string>): Danh sách các từ vi phạm đã tìm thấy.
 * - `severity` (string): Mức độ nghiêm trọng ('low', 'medium', 'high', 'critical').
 * - `riskScore` (number): Điểm rủi ro được tính dựa trên số lượng từ vi phạm (0, 50, 80, 100).
 * - `totalViolations` (number): Tổng số từ vi phạm.
 *
 * @logic
 * 1. Chuẩn hóa `content` về chữ thường và loại bỏ dấu tiếng Việt để phát hiện các biến thể.
 * 2. Lặp qua danh sách `BANNED_WORDS` để tìm kiếm sự tồn tại của chúng trong nội dung đã chuẩn hóa.
 * 3. Tính toán `riskScore` và `severity` dựa trên số lượng vi phạm được tìm thấy.
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
 * @function checkSpam
 * @description Phân tích nội dung để phát hiện các dấu hiệu của spam, dựa trên các mẫu (patterns) và cấu trúc văn bản.
 *
 * @param {string} content - Chuỗi văn bản cần được kiểm tra.
 *
 * @returns {Object} Một đối tượng chứa kết quả phân tích spam, bao gồm:
 * - `isSpam` (boolean): True nếu điểm rủi ro vượt ngưỡng 30.
 * - `spamLevel` (string): Mức độ spam ('low', 'medium', 'high').
 * - `riskScore` (number): Tổng điểm rủi ro được cộng dồn từ các yếu tố vi phạm.
 * - `analysisDetails` (Array<Object>): Mảng chứa chi tiết về từng yếu tố vi phạm được phát hiện.
 * - `recommendation` (string): Hành động đề xuất ('approve', 'review', 'reject').
 *
 * @logic
 * 1. Quét nội dung dựa trên danh sách `SPAM_PATTERNS` (URL, SĐT, email,...) và cộng dồn điểm rủi ro.
 * 2. Phân tích cấu trúc: cộng thêm điểm nếu nội dung quá ngắn, chứa quá nhiều chữ hoa, hoặc lặp lại từ khóa.
 * 3. Dựa trên tổng `riskScore`, phân loại `spamLevel` và đưa ra `recommendation`.
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
 * @function analyzeContent
 * @description Đây là hàm tổng hợp, điều phối việc phân tích nội dung. Nó gọi `checkProfanity` và `checkSpam`, sau đó kết hợp kết quả để đưa ra một đánh giá toàn diện.
 *
 * @param {string} titleOrContent - Tiêu đề của bài viết (thread) hoặc nội dung của bình luận (reply).
 * @param {string|null} content - Nội dung của bài viết (chỉ dành cho thread). Nếu là `null`, hàm sẽ hiểu đây là phân tích cho một bình luận.
 *
 * @returns {Object} Một đối tượng phân tích toàn diện, chứa:
 * - `profanity`: Kết quả trả về từ hàm `checkProfanity`.
 * - `spam`: Kết quả trả về từ hàm `checkSpam`.
 * - `overallRisk` (string): Mức độ rủi ro tổng thể ('low', 'medium', 'high', 'critical').
 * - `combinedScore` (number): Tổng điểm rủi ro từ cả profanity và spam.
 * - `shouldReject` (boolean): True nếu nội dung nên bị từ chối ngay lập tức.
 * - `shouldFlag` (boolean): True nếu nội dung cần được đưa vào hàng đợi kiểm duyệt.
 * - `recommendations` (Object): Một đối tượng chứa hành động và lý do đề xuất.
 *
 * @logic
 * 1. Gộp tiêu đề và nội dung (nếu là thread) thành một chuỗi duy nhất để phân tích.
 * 2. Lần lượt gọi `checkProfanity` và `checkSpam`.
 * 3. Cộng dồn `riskScore` từ hai hàm trên để có `combinedScore`.
 * 4. Dựa trên `combinedScore` và `severity` của profanity, xác định `overallRisk` và đưa ra quyết định cuối cùng (`shouldReject`, `shouldFlag`).
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
 * @function suggestModerationAction
 * @description Đề xuất hành động kiểm duyệt cuối cùng ('approve', 'review', 'reject') bằng cách kết hợp kết quả phân tích nội dung với thông tin của người dùng (vai trò, độ tin cậy, lịch sử).
 *
 * @param {Object} user - Đối tượng người dùng đầy đủ, chứa `role`, `trustLevel`, và `forumStats`.
 * @param {Object} contentAnalysis - Kết quả trả về từ hàm `analyzeContent`.
 * @param {string} [contentType="thread"] - Loại nội dung ('thread' hoặc 'reply') để áp dụng logic khác nhau.
 *
 * @returns {string} Hành động được đề xuất: "approve", "review", hoặc "reject".
 *
 * @logic (Decision Tree)
 * 1. **Bỏ qua cho Admin/Moderator**: Luôn trả về "approve".
 * 2. **Từ chối nội dung nghiêm trọng**: Nếu `shouldReject` là true, trả về "reject".
 * 3. **Kiểm tra lịch sử người dùng**: Nếu người dùng có nhiều báo cáo vi phạm, sẽ bị xem xét kỹ hơn.
 * 4. **Áp dụng logic riêng cho Thread**:
 *    - `trusted` user: Chỉ cần nội dung an toàn (`low` risk).
 *    - `new` user: Luôn phải chờ duyệt.
 *    - `basic` user: Cần nội dung rất an toàn để được duyệt tự động.
 * 5. **Áp dụng logic riêng cho Reply**:
 *    - Triết lý: Chỉ từ chối các bình luận có vi phạm rõ ràng (từ cấm, rủi ro cao), còn lại sẽ được duyệt để đảm bảo trải nghiệm người dùng mượt mà. Sẽ không có trạng thái "review" cho bình luận.
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
 * @function cleanContent
 * @description Lọc và làm sạch một chuỗi văn bản bằng cách thay thế các từ bị cấm, loại bỏ link, SĐT, email và các ký tự đặc biệt không mong muốn.
 *
 * @param {string} content - Chuỗi văn bản gốc cần làm sạch.
 *
 * @returns {string} Chuỗi văn bản đã được làm sạch.
 *
 * @logic
 * 1. Thay thế các từ trong `BANNED_WORDS` bằng các dấu `*`.
 * 2. Thay thế URL, SĐT, email bằng các placeholder như `[LINK_REMOVED]`.
 * 3. Giảm bớt các ký tự đặc biệt hoặc ký tự lặp lại quá mức.
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
