import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class DigitalFilesScreen extends ConsumerWidget {
  const DigitalFilesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filesAsync = ref.watch(digitalFilesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('فایل‌های دیجیتال')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: filesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (files) {
          if (files.isEmpty) {
            return const Center(child: Text('هنوز فایلی اضافه نکرده‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: files.length,
            itemBuilder: (context, i) {
              final f = files[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => _showSheet(context, ref, file: f),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: f.coverUrl != null
                            ? CachedNetworkImage(imageUrl: resolveImageUrl(f.coverUrl)!, width: 44, height: 44, fit: BoxFit.cover)
                            : Container(width: 44, height: 44, color: AppColors.surfaceGlass, child: const Icon(Icons.description_outlined, color: AppColors.textMuted)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(f.title, style: const TextStyle(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                            Text('${f.downloadCount} دانلود', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                      Text(f.isFree ? 'رایگان' : '${f.price.toStringAsFixed(0)} ت', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12)),
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

  void _showSheet(BuildContext context, WidgetRef ref, {DigitalFile? file}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _DigitalFileEditSheet(file: file),
    );
  }
}

class _DigitalFileEditSheet extends ConsumerStatefulWidget {
  final DigitalFile? file;
  const _DigitalFileEditSheet({this.file});
  @override
  ConsumerState<_DigitalFileEditSheet> createState() => _DigitalFileEditSheetState();
}

class _DigitalFileEditSheetState extends ConsumerState<_DigitalFileEditSheet> {
  late final _titleCtrl = TextEditingController(text: widget.file?.title);
  late final _descCtrl = TextEditingController(text: widget.file?.description);
  late final _priceCtrl = TextEditingController(text: widget.file?.price.toStringAsFixed(0));
  late final _fileUrlCtrl = TextEditingController(text: widget.file?.fileUrl);
  String? _coverUrl;
  bool _isFree = false;
  bool _saving = false;
  bool _uploading = false;

  bool get _isEdit => widget.file != null;

  @override
  void initState() {
    super.initState();
    _coverUrl = widget.file?.coverUrl;
    _isFree = widget.file?.isFree ?? false;
  }

  Future<void> _pickCover() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    setState(() => _uploading = true);
    try {
      final url = await ApiClient.instance.uploadImage(picked.path);
      setState(() => _coverUrl = url);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty || _fileUrlCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('عنوان و آدرس فایل را وارد کنید')));
      return;
    }
    setState(() => _saving = true);
    final body = {
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'fileUrl': _fileUrlCtrl.text.trim(),
      'price': num.tryParse(_priceCtrl.text) ?? 0,
      'isFree': _isFree,
      if (_coverUrl != null) 'coverUrl': _coverUrl,
    };
    try {
      if (_isEdit) {
        await ref.read(digitalFilesProvider.notifier).updateItem(widget.file!.id, body);
      } else {
        await ref.read(digitalFilesProvider.notifier).create(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(digitalFilesProvider.notifier).deleteItem(widget.file!.id);
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
            Text(_isEdit ? 'ویرایش فایل' : 'فایل دیجیتال جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _uploading ? null : _pickCover,
              child: Container(
                height: 100,
                decoration: BoxDecoration(color: AppColors.surfaceGlass, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: _uploading
                    ? const Center(child: CircularProgressIndicator())
                    : _coverUrl != null
                        ? ClipRRect(borderRadius: BorderRadius.circular(16), child: CachedNetworkImage(imageUrl: resolveImageUrl(_coverUrl)!, fit: BoxFit.cover, width: double.infinity))
                        : const Center(child: Text('افزودن عکس کاور', style: TextStyle(color: AppColors.textMuted, fontSize: 12))),
              ),
            ),
            const SizedBox(height: 12),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان فایل')),
            const SizedBox(height: 12),
            TextField(controller: _descCtrl, maxLines: 2, decoration: const InputDecoration(hintText: 'توضیحات (اختیاری)')),
            const SizedBox(height: 12),
            TextField(controller: _fileUrlCtrl, textDirection: TextDirection.ltr, decoration: const InputDecoration(hintText: 'آدرس فایل (URL)')),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: Text('رایگان', style: Theme.of(context).textTheme.bodyMedium)),
                Switch(value: _isFree, activeColor: AppColors.accent, onChanged: (v) => setState(() => _isFree = v)),
              ],
            ),
            if (!_isFree) ...[
              const SizedBox(height: 4),
              TextField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'قیمت (تومان)')),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
            ),
            if (_isEdit) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف فایل')),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
