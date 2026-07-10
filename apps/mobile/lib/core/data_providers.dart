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

Future<void> updateOrderStatus(String id, String status) => _api.put('/orders/$id/status', body: {'status': status});
Future<void> markOrderPaid(String id) => _api.put('/orders/$id/mark-paid');
