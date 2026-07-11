class Shop {
  final String id;
  final String slug;
  final String name;
  final String? bio;
  final String? avatarUrl;
  final String? bannerUrl;
  final String primaryColor;
  final bool isActive;

  Shop({
    required this.id,
    required this.slug,
    required this.name,
    this.bio,
    this.avatarUrl,
    this.bannerUrl,
    this.primaryColor = '#F97316',
    this.isActive = true,
  });

  factory Shop.fromJson(Map<String, dynamic> j) => Shop(
        id: j['id'] ?? '',
        slug: j['slug'] ?? '',
        name: j['name'] ?? '',
        bio: j['bio'],
        avatarUrl: j['avatarUrl'],
        bannerUrl: j['bannerUrl'],
        primaryColor: j['primaryColor'] ?? '#F97316',
        isActive: j['isActive'] ?? true,
      );
}

class LinkBlock {
  final String id;
  final String type;
  final String? label;
  final String? url;
  final String? icon;
  final bool isActive;
  final int clickCount;
  final int sortOrder;

  LinkBlock({
    required this.id,
    required this.type,
    this.label,
    this.url,
    this.icon,
    this.isActive = true,
    this.clickCount = 0,
    this.sortOrder = 0,
  });

  factory LinkBlock.fromJson(Map<String, dynamic> j) => LinkBlock(
        id: j['id'] ?? '',
        type: j['type'] ?? 'LINK',
        label: j['label'],
        url: j['url'],
        icon: j['icon'],
        isActive: j['isActive'] ?? true,
        clickCount: j['clickCount'] ?? 0,
        sortOrder: j['sortOrder'] ?? 0,
      );
}

class Product {
  final String id;
  final String name;
  final String? description;
  final num price;
  final int? stock;
  final List<String> images;
  final bool isAvailable;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.stock,
    this.images = const [],
    this.isAvailable = true,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'],
        price: j['price'] ?? 0,
        stock: j['stock'],
        images: (j['images'] as List?)?.map((e) => e.toString()).toList() ?? [],
        isAvailable: j['isAvailable'] ?? true,
      );
}

class Order {
  final String id;
  final String orderNumber;
  final String status;
  final num totalPrice;
  final String? customerName;
  final String? customerPhone;
  final DateTime? createdAt;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.totalPrice,
    this.customerName,
    this.customerPhone,
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: j['id'] ?? '',
        orderNumber: j['orderNumber']?.toString() ?? '',
        status: j['status'] ?? 'PENDING',
        totalPrice: j['totalPrice'] ?? 0,
        customerName: j['customerName'],
        customerPhone: j['customerPhone'],
        createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt']) : null,
      );
}

class AnalyticsSummary {
  final int pageViews;
  final int blockClicks;
  final double clickRate;
  final int orderCount;
  final num revenue;
  final List<Map<String, dynamic>> topBlocks;
  final List<Map<String, dynamic>> dailyViews;

  AnalyticsSummary({
    required this.pageViews,
    required this.blockClicks,
    required this.clickRate,
    required this.orderCount,
    required this.revenue,
    this.topBlocks = const [],
    this.dailyViews = const [],
  });

  factory AnalyticsSummary.fromJson(Map<String, dynamic> j) => AnalyticsSummary(
        pageViews: j['pageViews'] ?? 0,
        blockClicks: j['blockClicks'] ?? 0,
        clickRate: (j['clickRate'] ?? 0).toDouble(),
        orderCount: (j['orders']?['count']) ?? 0,
        revenue: (j['orders']?['revenue']) ?? 0,
        topBlocks: List<Map<String, dynamic>>.from(j['topBlocks'] ?? []),
        dailyViews: List<Map<String, dynamic>>.from(j['dailyViews'] ?? []),
      );
}

class Coupon {
  final String id;
  final String code;
  final String type; // percent | fixed
  final num value;
  final int? maxUses;
  final int usedCount;
  final DateTime? expiresAt;
  final bool isActive;
  final String scopeType; // ALL | PRODUCT | DIGITAL_FILE | COURSE | CATEGORY
  final String? scopeName;

  Coupon({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.maxUses,
    this.usedCount = 0,
    this.expiresAt,
    this.isActive = true,
    this.scopeType = 'ALL',
    this.scopeName,
  });

  factory Coupon.fromJson(Map<String, dynamic> j) => Coupon(
        id: j['id'] ?? '',
        code: j['code'] ?? '',
        type: j['type'] ?? 'percent',
        value: j['value'] ?? 0,
        maxUses: j['maxUses'],
        usedCount: j['usedCount'] ?? 0,
        expiresAt: j['expiresAt'] != null ? DateTime.tryParse(j['expiresAt']) : null,
        isActive: j['isActive'] ?? true,
        scopeType: j['scopeType'] ?? 'ALL',
        scopeName: j['scopeName'],
      );
}

class DigitalFile {
  final String id;
  final String title;
  final String? description;
  final String fileUrl;
  final String? coverUrl;
  final num price;
  final bool isFree;
  final int downloadCount;
  final bool isActive;

  DigitalFile({
    required this.id,
    required this.title,
    this.description,
    required this.fileUrl,
    this.coverUrl,
    this.price = 0,
    this.isFree = false,
    this.downloadCount = 0,
    this.isActive = true,
  });

  factory DigitalFile.fromJson(Map<String, dynamic> j) => DigitalFile(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        description: j['description'],
        fileUrl: j['fileUrl'] ?? '',
        coverUrl: j['coverUrl'],
        price: num.tryParse(j['price']?.toString() ?? '0') ?? 0,
        isFree: j['isFree'] ?? false,
        downloadCount: j['downloadCount'] ?? 0,
        isActive: j['isActive'] ?? true,
      );
}

class FlashSale {
  final String id;
  final String title;
  final String? description;
  final num originalPrice;
  final num salePrice;
  final String? imageUrl;
  final DateTime? endsAt;
  final bool isActive;
  final int clickCount;

  FlashSale({
    required this.id,
    required this.title,
    this.description,
    required this.originalPrice,
    required this.salePrice,
    this.imageUrl,
    this.endsAt,
    this.isActive = true,
    this.clickCount = 0,
  });

  factory FlashSale.fromJson(Map<String, dynamic> j) => FlashSale(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        description: j['description'],
        originalPrice: num.tryParse(j['originalPrice']?.toString() ?? '0') ?? 0,
        salePrice: num.tryParse(j['salePrice']?.toString() ?? '0') ?? 0,
        imageUrl: j['imageUrl'],
        endsAt: j['endsAt'] != null ? DateTime.tryParse(j['endsAt']) : null,
        isActive: j['isActive'] ?? true,
        clickCount: j['clickCount'] ?? 0,
      );
}

class AutoReplyRule {
  final String id;
  final String platform;
  final String keyword;
  final String reply;
  final bool isActive;
  final int triggerCount;

  AutoReplyRule({
    required this.id,
    required this.platform,
    required this.keyword,
    required this.reply,
    this.isActive = true,
    this.triggerCount = 0,
  });

  factory AutoReplyRule.fromJson(Map<String, dynamic> j) => AutoReplyRule(
        id: j['id'] ?? '',
        platform: j['platform'] ?? 'telegram',
        keyword: j['keyword'] ?? '',
        reply: j['reply'] ?? '',
        isActive: j['isActive'] ?? true,
        triggerCount: j['triggerCount'] ?? 0,
      );
}

class AffiliateLink {
  final String id;
  final String title;
  final String originalUrl;
  final num commission;
  final int clickCount;
  final num earnings;
  final bool isActive;

  AffiliateLink({
    required this.id,
    required this.title,
    required this.originalUrl,
    this.commission = 0,
    this.clickCount = 0,
    this.earnings = 0,
    this.isActive = true,
  });

  factory AffiliateLink.fromJson(Map<String, dynamic> j) => AffiliateLink(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        originalUrl: j['originalUrl'] ?? '',
        commission: j['commission'] ?? 0,
        clickCount: j['clickCount'] ?? 0,
        earnings: num.tryParse(j['earnings']?.toString() ?? '0') ?? 0,
        isActive: j['isActive'] ?? true,
      );
}

class ShortLink {
  final String id;
  final String originalUrl;
  final String shortCode;
  final String? title;
  final int clickCount;
  final bool isActive;

  ShortLink({
    required this.id,
    required this.originalUrl,
    required this.shortCode,
    this.title,
    this.clickCount = 0,
    this.isActive = true,
  });

  factory ShortLink.fromJson(Map<String, dynamic> j) => ShortLink(
        id: j['id'] ?? '',
        originalUrl: j['originalUrl'] ?? '',
        shortCode: j['shortCode'] ?? '',
        title: j['title'],
        clickCount: j['clickCount'] ?? 0,
        isActive: j['isActive'] ?? true,
      );
}

class AudienceLead {
  final String id;
  final String email;
  final String? name;
  final String? source;
  final DateTime? createdAt;

  AudienceLead({required this.id, required this.email, this.name, this.source, this.createdAt});

  factory AudienceLead.fromJson(Map<String, dynamic> j) => AudienceLead(
        id: j['id'] ?? '',
        email: j['email'] ?? '',
        name: j['name'],
        source: j['source'],
        createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt']) : null,
      );
}

class Course {
  final String id;
  final String title;
  final String? description;
  final String? coverUrl;
  final num price;
  final bool isFree;
  final bool isActive;
  final int chapterCount;
  final int enrollmentCount;

  Course({
    required this.id,
    required this.title,
    this.description,
    this.coverUrl,
    this.price = 0,
    this.isFree = false,
    this.isActive = true,
    this.chapterCount = 0,
    this.enrollmentCount = 0,
  });

  factory Course.fromJson(Map<String, dynamic> j) => Course(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        description: j['description'],
        coverUrl: j['coverUrl'],
        price: num.tryParse(j['price']?.toString() ?? '0') ?? 0,
        isFree: j['isFree'] ?? false,
        isActive: j['isActive'] ?? true,
        chapterCount: j['_count']?['chapters'] ?? 0,
        enrollmentCount: j['_count']?['enrollments'] ?? 0,
      );
}

class CourseVideo {
  String title;
  String videoUrl;
  String? coverUrl;
  CourseVideo({required this.title, required this.videoUrl, this.coverUrl});
  factory CourseVideo.fromJson(Map<String, dynamic> j) =>
      CourseVideo(title: j['title'] ?? '', videoUrl: j['videoUrl'] ?? '', coverUrl: j['coverUrl']);
  Map<String, dynamic> toJson() => {'title': title, 'videoUrl': videoUrl, if (coverUrl != null) 'coverUrl': coverUrl};
}

class CourseChapter {
  final String id;
  final String title;
  final List<CourseVideo> videos;
  final bool isPreview;
  final int sortOrder;

  CourseChapter({required this.id, required this.title, this.videos = const [], this.isPreview = false, this.sortOrder = 0});

  factory CourseChapter.fromJson(Map<String, dynamic> j) => CourseChapter(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        videos: (j['videos'] as List? ?? []).map((v) => CourseVideo.fromJson(v)).toList(),
        isPreview: j['isPreview'] ?? false,
        sortOrder: j['sortOrder'] ?? 0,
      );
}

class AppointmentService {
  final String id;
  final String name;
  final String? description;
  final int durationMins;
  final num price;
  final bool isFree;
  final bool isActive;
  final String color;
  final List<int> workDays;
  final String startTime;
  final String endTime;
  final int slotMinutes;
  final int bookingCount;

  AppointmentService({
    required this.id,
    required this.name,
    this.description,
    this.durationMins = 30,
    this.price = 0,
    this.isFree = false,
    this.isActive = true,
    this.color = '#F97316',
    this.workDays = const [0, 1, 2, 3, 4],
    this.startTime = '09:00',
    this.endTime = '18:00',
    this.slotMinutes = 30,
    this.bookingCount = 0,
  });

  factory AppointmentService.fromJson(Map<String, dynamic> j) => AppointmentService(
        id: j['id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'],
        durationMins: j['durationMins'] ?? 30,
        price: num.tryParse(j['price']?.toString() ?? '0') ?? 0,
        isFree: j['isFree'] ?? false,
        isActive: j['isActive'] ?? true,
        color: j['color'] ?? '#F97316',
        workDays: List<int>.from(j['workDays'] ?? [0, 1, 2, 3, 4]),
        startTime: j['startTime'] ?? '09:00',
        endTime: j['endTime'] ?? '18:00',
        slotMinutes: j['slotMinutes'] ?? 30,
        bookingCount: j['_count']?['appointments'] ?? 0,
      );
}

class AppointmentBooking {
  final String id;
  final String customerName;
  final String customerPhone;
  final DateTime? date;
  final String status;
  final String? note;
  final String? serviceName;
  final String? serviceColor;

  AppointmentBooking({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    this.date,
    this.status = 'PENDING',
    this.note,
    this.serviceName,
    this.serviceColor,
  });

  factory AppointmentBooking.fromJson(Map<String, dynamic> j) => AppointmentBooking(
        id: j['id'] ?? '',
        customerName: j['customerName'] ?? '',
        customerPhone: j['customerPhone'] ?? '',
        date: j['date'] != null ? DateTime.tryParse(j['date']) : null,
        status: j['status'] ?? 'PENDING',
        note: j['note'],
        serviceName: j['service']?['name'],
        serviceColor: j['service']?['color'],
      );
}

class ContentPlan {
  final String id;
  final String title;
  final String? description;
  final String platform;
  final String contentType;
  final DateTime? scheduledAt;
  final String status;
  final String? color;

  ContentPlan({
    required this.id,
    required this.title,
    this.description,
    this.platform = 'instagram',
    this.contentType = 'post',
    this.scheduledAt,
    this.status = 'PLANNED',
    this.color,
  });

  factory ContentPlan.fromJson(Map<String, dynamic> j) => ContentPlan(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        description: j['description'],
        platform: j['platform'] ?? 'instagram',
        contentType: j['contentType'] ?? 'post',
        scheduledAt: j['scheduledAt'] != null ? DateTime.tryParse(j['scheduledAt']) : null,
        status: j['status'] ?? 'PLANNED',
        color: j['color'],
      );
}

class ABTest {
  final String id;
  final String name;
  final String status;
  final String? winner;
  final int impressionA;
  final int impressionB;
  final int conversionA;
  final int conversionB;

  ABTest({
    required this.id,
    required this.name,
    this.status = 'RUNNING',
    this.winner,
    this.impressionA = 0,
    this.impressionB = 0,
    this.conversionA = 0,
    this.conversionB = 0,
  });

  factory ABTest.fromJson(Map<String, dynamic> j) => ABTest(
        id: j['id'] ?? '',
        name: j['name'] ?? '',
        status: j['status'] ?? 'RUNNING',
        winner: j['winner'],
        impressionA: j['impressionA'] ?? 0,
        impressionB: j['impressionB'] ?? 0,
        conversionA: j['conversionA'] ?? 0,
        conversionB: j['conversionB'] ?? 0,
      );
}
