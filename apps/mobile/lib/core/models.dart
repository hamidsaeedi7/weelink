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
