import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

const _statusLabels = {
  'PENDING': ('در انتظار', AppColors.warning),
  'PAID': ('پرداخت‌شده', AppColors.success),
  'PROCESSING': ('در حال پردازش', AppColors.info),
  'SHIPPED': ('ارسال‌شده', AppColors.info),
  'DELIVERED': ('تحویل‌شده', AppColors.success),
  'CANCELLED': ('لغوشده', AppColors.danger),
};

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersProvider);
    final filter = ref.watch(ordersStatusFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('سفارش‌ها')),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _FilterChip(label: 'همه', selected: filter == null, onTap: () => ref.read(ordersStatusFilterProvider.notifier).state = null),
                for (final s in _statusLabels.entries)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _FilterChip(label: s.value.$1, selected: filter == s.key, onTap: () => ref.read(ordersStatusFilterProvider.notifier).state = s.key),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ordersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
              data: (orders) {
                if (orders.isEmpty) {
                  return const Center(child: Text('سفارشی یافت نشد', style: TextStyle(color: AppColors.textMuted)));
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 90),
                  itemCount: orders.length,
                  itemBuilder: (context, i) {
                    final o = orders[i];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _OrderTile(order: o).animate().fadeIn(delay: (i * 40).ms),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.accent,
        backgroundColor: AppColors.surfaceGlass,
        labelStyle: TextStyle(color: selected ? Colors.white : AppColors.textSecondary, fontSize: 12),
        side: const BorderSide(color: AppColors.border),
      ),
    );
  }
}

class _OrderTile extends ConsumerWidget {
  final Order order;
  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final st = _statusLabels[order.status] ?? (order.status, AppColors.textMuted);
    return GlassCard(
      onTap: () => _showDetail(context, ref),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('#${order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                if (order.customerName != null) Text(order.customerName!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: st.$2.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                child: Text(st.$1, style: TextStyle(color: st.$2, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 6),
              Text('${order.totalPrice.toStringAsFixed(0)} ت', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  void _showDetail(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('سفارش #${order.orderNumber}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            if (order.customerName != null) Text('مشتری: ${order.customerName}'),
            if (order.customerPhone != null) Text('موبایل: ${order.customerPhone}', textDirection: TextDirection.ltr),
            Text('مبلغ: ${order.totalPrice.toStringAsFixed(0)} تومان'),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in _statusLabels.keys)
                  ActionChip(
                    label: Text(_statusLabels[s]!.$1),
                    backgroundColor: order.status == s ? AppColors.accent : AppColors.surfaceGlass,
                    labelStyle: TextStyle(color: order.status == s ? Colors.white : AppColors.textSecondary, fontSize: 12),
                    onPressed: () async {
                      await updateOrderStatus(order.id, s);
                      ref.invalidate(ordersProvider);
                      if (context.mounted) Navigator.pop(context);
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
