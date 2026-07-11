import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'models.dart';

final _api = ApiClient.instance;

/// پروفایل فروشگاه
final shopProvider = FutureProvider.autoDispose<Shop>((ref) async {
  return _api.get('/me/shop', parse: (j) => Shop.fromJson(j));
});

/// آمار داشبورد
final analyticsProvider = FutureProvider.autoDispose<AnalyticsSummary>((ref) async {
  return _api.get('/analytics/dashboard', query: {'days': 30}, parse: (j) => AnalyticsSummary.fromJson(j));
});

/// لینک‌ها (بلوک‌ها)
class BlocksNotifier extends AsyncNotifier<List<LinkBlock>> {
  @override
  Future<List<LinkBlock>> build() async {
    final list = await _api.get<List>('/blocks', parse: (j) => j as List);
    return list.map((e) => LinkBlock.fromJson(e)).toList();
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }

  Future<void> toggleActive(LinkBlock b) async {
    await _api.put('/blocks/${b.id}', body: {'isActive': !b.isActive});
    await reload();
  }

  Future<void> deleteBlock(String id) async {
    await _api.delete('/blocks/$id');
    await reload();
  }

  Future<void> createBlock({required String type, String? label, String? url}) async {
    await _api.post('/blocks', body: {'type': type, if (label != null) 'label': label, if (url != null) 'url': url});
    await reload();
  }

  Future<void> updateBlock(String id, {String? label, String? url}) async {
    await _api.put('/blocks/$id', body: {if (label != null) 'label': label, if (url != null) 'url': url});
    await reload();
  }

  Future<void> reorder(List<String> ids) async {
    final current = state.value ?? [];
    final reordered = [for (final id in ids) current.firstWhere((b) => b.id == id)];
    state = AsyncData(reordered);
    await _api.put('/blocks/reorder', body: {'ids': ids});
  }
}

final blocksProvider = AsyncNotifierProvider<BlocksNotifier, List<LinkBlock>>(BlocksNotifier.new);

/// محصولات فیزیکی
class ProductsNotifier extends AsyncNotifier<List<Product>> {
  @override
  Future<List<Product>> build() async {
    final list = await _api.get<List>('/products', parse: (j) => j as List);
    return list.map((e) => Product.fromJson(e)).toList();
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }

  Future<void> deleteProduct(String id) async {
    await _api.delete('/products/$id');
    await reload();
  }

  Future<void> createProduct(Map<String, dynamic> body) async {
    await _api.post('/products', body: body);
    await reload();
  }

  Future<void> updateProduct(String id, Map<String, dynamic> body) async {
    await _api.put('/products/$id', body: body);
    await reload();
  }
}

final productsProvider = AsyncNotifierProvider<ProductsNotifier, List<Product>>(ProductsNotifier.new);

/// سفارش‌ها
final ordersStatusFilterProvider = StateProvider<String?>((ref) => null);

final ordersProvider = FutureProvider.autoDispose<List<Order>>((ref) async {
  final status = ref.watch(ordersStatusFilterProvider);
  // پاسخ سرور به‌صورت {orders: [...], total, page, pages} است، نه یک آرایه‌ی خام
  final list = await _api.get<List>(
    '/orders/mine',
    query: {if (status != null) 'status': status},
    parse: (j) => (j['orders'] as List),
  );
  return list.map((e) => Order.fromJson(e)).toList();
});

/// پایه‌ی مشترک برای بخش‌هایی که فقط لیست ساده + فرم افزودن/ویرایش/حذف دارند
abstract class SimpleListNotifier<T> extends AsyncNotifier<List<T>> {
  String get endpoint;
  T Function(Map<String, dynamic>) get fromJson;

  @override
  Future<List<T>> build() async {
    final list = await _api.get<List>(endpoint, parse: (j) => j as List);
    return list.map((e) => fromJson(e)).toList();
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }

  Future<void> create(Map<String, dynamic> body) async {
    await _api.post(endpoint, body: body);
    await reload();
  }

  Future<void> updateItem(String id, Map<String, dynamic> body) async {
    await _api.put('$endpoint/$id', body: body);
    await reload();
  }

  Future<void> deleteItem(String id) async {
    await _api.delete('$endpoint/$id');
    await reload();
  }
}

/// کوپن‌های تخفیف
class CouponsNotifier extends SimpleListNotifier<Coupon> {
  @override
  String get endpoint => '/coupons';
  @override
  Coupon Function(Map<String, dynamic>) get fromJson => Coupon.fromJson;
}

final couponsProvider = AsyncNotifierProvider<CouponsNotifier, List<Coupon>>(CouponsNotifier.new);

/// فایل‌های دیجیتال
class DigitalFilesNotifier extends SimpleListNotifier<DigitalFile> {
  @override
  String get endpoint => '/digital-files';
  @override
  DigitalFile Function(Map<String, dynamic>) get fromJson => DigitalFile.fromJson;
}

final digitalFilesProvider = AsyncNotifierProvider<DigitalFilesNotifier, List<DigitalFile>>(DigitalFilesNotifier.new);

/// فلش‌سیل
class FlashSalesNotifier extends SimpleListNotifier<FlashSale> {
  @override
  String get endpoint => '/flash-sales';
  @override
  FlashSale Function(Map<String, dynamic>) get fromJson => FlashSale.fromJson;
}

final flashSalesProvider = AsyncNotifierProvider<FlashSalesNotifier, List<FlashSale>>(FlashSalesNotifier.new);

/// پاسخ خودکار
class AutoReplyNotifier extends SimpleListNotifier<AutoReplyRule> {
  @override
  String get endpoint => '/auto-reply';
  @override
  AutoReplyRule Function(Map<String, dynamic>) get fromJson => AutoReplyRule.fromJson;
}

final autoReplyProvider = AsyncNotifierProvider<AutoReplyNotifier, List<AutoReplyRule>>(AutoReplyNotifier.new);

/// همکاری در فروش (افیلیت)
class AffiliateNotifier extends SimpleListNotifier<AffiliateLink> {
  @override
  String get endpoint => '/affiliate';
  @override
  AffiliateLink Function(Map<String, dynamic>) get fromJson => AffiliateLink.fromJson;
}

final affiliateProvider = AsyncNotifierProvider<AffiliateNotifier, List<AffiliateLink>>(AffiliateNotifier.new);

/// لینک کوتاه (فقط ساخت/حذف — بدون ویرایش)
class ShortLinksNotifier extends SimpleListNotifier<ShortLink> {
  @override
  String get endpoint => '/short-links';
  @override
  ShortLink Function(Map<String, dynamic>) get fromJson => ShortLink.fromJson;
}

final shortLinksProvider = AsyncNotifierProvider<ShortLinksNotifier, List<ShortLink>>(ShortLinksNotifier.new);

/// مخاطبین (فقط خواندن + حذف — ساخت فقط از سمت بازدیدکننده عمومی است)
class AudienceNotifier extends AsyncNotifier<List<AudienceLead>> {
  @override
  Future<List<AudienceLead>> build() async {
    final list = await _api.get<List>('/audience', parse: (j) => j as List);
    return list.map((e) => AudienceLead.fromJson(e)).toList();
  }

  Future<void> deleteItem(String id) async {
    await _api.delete('/audience/$id');
    state = const AsyncLoading();
    state = AsyncData(await build());
  }
}

final audienceProvider = AsyncNotifierProvider<AudienceNotifier, List<AudienceLead>>(AudienceNotifier.new);

/// دوره‌های آموزشی
class CoursesNotifier extends SimpleListNotifier<Course> {
  @override
  String get endpoint => '/courses';
  @override
  Course Function(Map<String, dynamic>) get fromJson => Course.fromJson;
}

final coursesProvider = AsyncNotifierProvider<CoursesNotifier, List<Course>>(CoursesNotifier.new);

/// فصل‌های یک دوره (وابسته به courseId)
class CourseChaptersNotifier extends FamilyAsyncNotifier<List<CourseChapter>, String> {
  @override
  Future<List<CourseChapter>> build(String courseId) async {
    final list = await _api.get<List>('/courses/$courseId/chapters', parse: (j) => j as List);
    return list.map((e) => CourseChapter.fromJson(e)).toList();
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = AsyncData(await build(arg));
  }

  Future<void> create(Map<String, dynamic> body) async {
    await _api.post('/courses/$arg/chapters', body: body);
    await reload();
  }

  Future<void> updateItem(String chapterId, Map<String, dynamic> body) async {
    await _api.put('/courses/chapters/$chapterId', body: body);
    await reload();
  }

  Future<void> deleteItem(String chapterId) async {
    await _api.delete('/courses/chapters/$chapterId');
    await reload();
  }
}

final courseChaptersProvider =
    AsyncNotifierProvider.family<CourseChaptersNotifier, List<CourseChapter>, String>(CourseChaptersNotifier.new);

/// سرویس‌های نوبت‌دهی
class AppointmentServicesNotifier extends SimpleListNotifier<AppointmentService> {
  @override
  String get endpoint => '/appointments/services';
  @override
  AppointmentService Function(Map<String, dynamic>) get fromJson => AppointmentService.fromJson;
}

final appointmentServicesProvider =
    AsyncNotifierProvider<AppointmentServicesNotifier, List<AppointmentService>>(AppointmentServicesNotifier.new);

/// نوبت‌های رزروشده
final appointmentBookingsProvider = FutureProvider.autoDispose<List<AppointmentBooking>>((ref) async {
  final list = await _api.get<List>('/appointments/bookings', parse: (j) => j as List);
  return list.map((e) => AppointmentBooking.fromJson(e)).toList();
});

Future<void> updateBookingStatus(String id, String status) => _api.put('/appointments/bookings/$id', body: {'status': status});

/// تقویم محتوایی
class ContentPlansNotifier extends SimpleListNotifier<ContentPlan> {
  @override
  String get endpoint => '/content-plans';
  @override
  ContentPlan Function(Map<String, dynamic>) get fromJson => ContentPlan.fromJson;
}

final contentPlansProvider = AsyncNotifierProvider<ContentPlansNotifier, List<ContentPlan>>(ContentPlansNotifier.new);

/// تست A/B
final abTestsProvider = FutureProvider.autoDispose<List<ABTest>>((ref) async {
  final list = await _api.get<List>('/ab-tests', parse: (j) => j as List);
  return list.map((e) => ABTest.fromJson(e)).toList();
});

Future<void> createAbTest(String name) => _api.post('/ab-tests', body: {'name': name});
Future<void> pauseAbTest(String id) => _api.put('/ab-tests/$id/pause');
Future<void> endAbTest(String id, String winner) => _api.put('/ab-tests/$id/end', body: {'winner': winner});

Future<void> updateOrderStatus(String id, String status) => _api.put('/orders/$id/status', body: {'status': status});
Future<void> markOrderPaid(String id) => _api.put('/orders/$id/mark-paid');
