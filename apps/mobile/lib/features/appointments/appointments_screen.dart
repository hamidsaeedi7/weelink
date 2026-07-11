import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

const _weekDays = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const _statusLabels = {
  'PENDING': ('در انتظار', AppColors.warning),
  'CONFIRMED': ('تأییدشده', AppColors.success),
  'CANCELLED': ('لغوشده', AppColors.danger),
  'DONE': ('انجام‌شده', AppColors.info),
};

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});
  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen> with SingleTickerProviderStateMixin {
  late final _tabs = TabController(length: 2, vsync: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('نوبت‌دهی'),
        bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'سرویس‌ها'), Tab(text: 'رزروها')], labelColor: AppColors.accent, indicatorColor: AppColors.accent),
      ),
      floatingActionButton: AnimatedBuilder(
        animation: _tabs,
        builder: (context, _) => _tabs.index == 0
            ? FloatingActionButton(onPressed: () => _showServiceSheet(context), child: const Icon(Icons.add_rounded))
            : const SizedBox.shrink(),
      ),
      body: TabBarView(controller: _tabs, children: [_ServicesTab(onEdit: (s) => _showServiceSheet(context, service: s)), const _BookingsTab()]),
    );
  }

  void _showServiceSheet(BuildContext context, {AppointmentService? service}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _ServiceEditSheet(service: service),
    );
  }
}

class _ServicesTab extends ConsumerWidget {
  final void Function(AppointmentService) onEdit;
  const _ServicesTab({required this.onEdit});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(appointmentServicesProvider);
    return servicesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
      data: (services) {
        if (services.isEmpty) {
          return const Center(child: Text('هنوز سرویسی نساخته‌اید', style: TextStyle(color: AppColors.textMuted)));
        }
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
          itemCount: services.length,
          itemBuilder: (context, i) {
            final s = services[i];
            final color = Color(int.parse(s.color.replaceFirst('#', '0xFF')));
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                onTap: () => onEdit(s),
                child: Row(
                  children: [
                    Container(width: 6, height: 40, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          Text('${s.durationMins} دقیقه · ${s.bookingCount} نوبت', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                    Text(s.isFree ? 'رایگان' : '${s.price.toStringAsFixed(0)} ت', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
              ).animate().fadeIn(delay: (i * 50).ms),
            );
          },
        );
      },
    );
  }
}

class _BookingsTab extends ConsumerWidget {
  const _BookingsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(appointmentBookingsProvider);
    return bookingsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
      data: (bookings) {
        if (bookings.isEmpty) {
          return const Center(child: Text('هنوز نوبتی رزرو نشده', style: TextStyle(color: AppColors.textMuted)));
        }
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          itemCount: bookings.length,
          itemBuilder: (context, i) {
            final b = bookings[i];
            final st = _statusLabels[b.status] ?? (b.status, AppColors.textMuted);
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                onTap: () => _showStatusSheet(context, ref, b),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b.customerName, style: const TextStyle(fontWeight: FontWeight.w700)),
                          Text(b.serviceName ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          if (b.date != null) Text(b.date!.toLocal().toString().split('.').first, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: st.$2.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                      child: Text(st.$1, style: TextStyle(color: st.$2, fontSize: 11, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: (i * 50).ms),
            );
          },
        );
      },
    );
  }

  void _showStatusSheet(BuildContext context, WidgetRef ref, AppointmentBooking b) {
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
            Text(b.customerName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            Text(b.customerPhone, textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.textMuted)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in _statusLabels.keys)
                  ActionChip(
                    label: Text(_statusLabels[s]!.$1),
                    backgroundColor: b.status == s ? AppColors.accent : AppColors.surfaceGlass,
                    labelStyle: TextStyle(color: b.status == s ? Colors.white : AppColors.textSecondary, fontSize: 12),
                    onPressed: () async {
                      await updateBookingStatus(b.id, s);
                      ref.invalidate(appointmentBookingsProvider);
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

class _ServiceEditSheet extends ConsumerStatefulWidget {
  final AppointmentService? service;
  const _ServiceEditSheet({this.service});
  @override
  ConsumerState<_ServiceEditSheet> createState() => _ServiceEditSheetState();
}

class _ServiceEditSheetState extends ConsumerState<_ServiceEditSheet> {
  late final _nameCtrl = TextEditingController(text: widget.service?.name);
  late final _durationCtrl = TextEditingController(text: (widget.service?.durationMins ?? 30).toString());
  late final _priceCtrl = TextEditingController(text: widget.service?.price.toStringAsFixed(0));
  late Set<int> _workDays = Set.of(widget.service?.workDays ?? [0, 1, 2, 3, 4]);
  late TimeOfDay _start = _parseTime(widget.service?.startTime ?? '09:00');
  late TimeOfDay _end = _parseTime(widget.service?.endTime ?? '18:00');
  bool _isFree = false;
  bool _saving = false;

  bool get _isEdit => widget.service != null;

  static TimeOfDay _parseTime(String s) {
    final parts = s.split(':');
    return TimeOfDay(hour: int.tryParse(parts[0]) ?? 9, minute: int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0);
  }

  String _fmt(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  void initState() {
    super.initState();
    _isFree = widget.service?.isFree ?? false;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final body = {
      'name': _nameCtrl.text.trim(),
      'durationMins': int.tryParse(_durationCtrl.text) ?? 30,
      'price': num.tryParse(_priceCtrl.text) ?? 0,
      'isFree': _isFree,
      'workDays': _workDays.toList(),
      'startTime': _fmt(_start),
      'endTime': _fmt(_end),
    };
    try {
      final notifier = ref.read(appointmentServicesProvider.notifier);
      if (_isEdit) {
        await notifier.updateItem(widget.service!.id, body);
      } else {
        await notifier.create(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(appointmentServicesProvider.notifier).deleteItem(widget.service!.id);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(_isEdit ? 'ویرایش سرویس' : 'سرویس جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'نام سرویس')),
            const SizedBox(height: 12),
            TextField(controller: _durationCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'مدت زمان (دقیقه)')),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Text('رایگان', style: Theme.of(context).textTheme.bodyMedium)),
              Switch(value: _isFree, activeColor: AppColors.accent, onChanged: (v) => setState(() => _isFree = v)),
            ]),
            if (!_isFree) TextField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'قیمت (تومان)')),
            const SizedBox(height: 12),
            const Text('روزهای کاری', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: [
                for (int d = 0; d < 7; d++)
                  FilterChip(
                    label: Text(_weekDays[d], style: const TextStyle(fontSize: 11)),
                    selected: _workDays.contains(d),
                    onSelected: (v) => setState(() => v ? _workDays.add(d) : _workDays.remove(d)),
                    selectedColor: AppColors.accent,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: GlassCard(
                  onTap: () async {
                    final t = await showTimePicker(context: context, initialTime: _start);
                    if (t != null) setState(() => _start = t);
                  },
                  child: Text('شروع: ${_fmt(_start)}', textAlign: TextAlign.center),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: GlassCard(
                  onTap: () async {
                    final t = await showTimePicker(context: context, initialTime: _end);
                    if (t != null) setState(() => _end = t);
                  },
                  child: Text('پایان: ${_fmt(_end)}', textAlign: TextAlign.center),
                ),
              ),
            ]),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
            ),
            if (_isEdit) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف سرویس')),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
