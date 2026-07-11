import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class FlashSaleScreen extends ConsumerWidget {
  const FlashSaleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salesAsync = ref.watch(flashSalesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('فلش‌سیل')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: salesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (sales) {
          if (sales.isEmpty) {
            return const Center(child: Text('هنوز فلش‌سیلی نساخته‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: sales.length,
            itemBuilder: (context, i) {
              final s = sales[i];
              final expired = s.endsAt != null && s.endsAt!.isBefore(DateTime.now());
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => _showSheet(context, ref, sale: s),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: s.imageUrl != null
                            ? CachedNetworkImage(imageUrl: resolveImageUrl(s.imageUrl)!, width: 48, height: 48, fit: BoxFit.cover)
                            : Container(width: 48, height: 48, color: AppColors.surfaceGlass, child: const Icon(Icons.bolt_rounded, color: AppColors.warning)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Row(children: [
                              Text('${s.originalPrice.toStringAsFixed(0)}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11, decoration: TextDecoration.lineThrough)),
                              const SizedBox(width: 6),
                              Text('${s.salePrice.toStringAsFixed(0)} ت', style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold, fontSize: 12)),
                            ]),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: (expired ? AppColors.textMuted : AppColors.success).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                        child: Text(expired ? 'پایان‌یافته' : 'فعال', style: TextStyle(color: expired ? AppColors.textMuted : AppColors.success, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: (i * 50).ms),
              );
            },
          );
        },
      ),
    );
  }

  void _showSheet(BuildContext context, WidgetRef ref, {FlashSale? sale}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _FlashSaleEditSheet(sale: sale),
    );
  }
}

class _FlashSaleEditSheet extends ConsumerStatefulWidget {
  final FlashSale? sale;
  const _FlashSaleEditSheet({this.sale});
  @override
  ConsumerState<_FlashSaleEditSheet> createState() => _FlashSaleEditSheetState();
}

class _FlashSaleEditSheetState extends ConsumerState<_FlashSaleEditSheet> {
  late final _titleCtrl = TextEditingController(text: widget.sale?.title);
  late final _originalCtrl = TextEditingController(text: widget.sale?.originalPrice.toStringAsFixed(0));
  late final _saleCtrl = TextEditingController(text: widget.sale?.salePrice.toStringAsFixed(0));
  String? _imageUrl;
  DateTime _endsAt = DateTime.now().add(const Duration(hours: 24));
  bool _saving = false;
  bool _uploading = false;
  String? _error;

  bool get _isEdit => widget.sale != null;

  @override
  void initState() {
    super.initState();
    _imageUrl = widget.sale?.imageUrl;
    if (widget.sale?.endsAt != null) _endsAt = widget.sale!.endsAt!;
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    setState(() => _uploading = true);
    try {
      final url = await ApiClient.instance.uploadImage(picked.path);
      setState(() => _imageUrl = url);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _pickEndDate() async {
    final date = await showDatePicker(context: context, initialDate: _endsAt, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_endsAt));
    if (time == null) return;
    setState(() => _endsAt = DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; });
    final body = {
      'title': _titleCtrl.text.trim(),
      'originalPrice': num.tryParse(_originalCtrl.text) ?? 0,
      'salePrice': num.tryParse(_saleCtrl.text) ?? 0,
      'endsAt': _endsAt.toIso8601String(),
      if (_imageUrl != null) 'imageUrl': _imageUrl,
    };
    try {
      if (_isEdit) {
        await ref.read(flashSalesProvider.notifier).updateItem(widget.sale!.id, body);
      } else {
        await ref.read(flashSalesProvider.notifier).create(body);
      }
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      setState(() => _error = e.code == 'PRO_REQUIRED' ? 'این ویژگی مخصوص اشتراک PRO است' : e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(flashSalesProvider.notifier).deleteItem(widget.sale!.id);
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
            Text(_isEdit ? 'ویرایش فلش‌سیل' : 'فلش‌سیل جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _uploading ? null : _pickImage,
              child: Container(
                height: 100,
                decoration: BoxDecoration(color: AppColors.surfaceGlass, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: _uploading
                    ? const Center(child: CircularProgressIndicator())
                    : _imageUrl != null
                        ? ClipRRect(borderRadius: BorderRadius.circular(16), child: CachedNetworkImage(imageUrl: resolveImageUrl(_imageUrl)!, fit: BoxFit.cover, width: double.infinity))
                        : const Center(child: Text('افزودن عکس', style: TextStyle(color: AppColors.textMuted, fontSize: 12))),
              ),
            ),
            const SizedBox(height: 12),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان')),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextField(controller: _originalCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'قیمت اصلی'))),
              const SizedBox(width: 10),
              Expanded(child: TextField(controller: _saleCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'قیمت با تخفیف'))),
            ]),
            const SizedBox(height: 12),
            GlassCard(
              onTap: _pickEndDate,
              child: Row(children: [
                const Icon(Icons.timer_outlined, color: AppColors.accent, size: 18),
                const SizedBox(width: 8),
                Text('پایان: ${_endsAt.toLocal().toString().substring(0, 16)}'),
              ]),
            ),
            if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: AppColors.danger))),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
            ),
            if (_isEdit) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف')),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
