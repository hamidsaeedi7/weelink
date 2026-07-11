import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import 'course_chapters_screen.dart';

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('دوره‌های آموزشی')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: coursesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (courses) {
          if (courses.isEmpty) {
            return const Center(child: Text('هنوز دوره‌ای نساخته‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: courses.length,
            itemBuilder: (context, i) {
              final c = courses[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  padding: EdgeInsets.zero,
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CourseChaptersScreen(course: c))),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(20)),
                        child: c.coverUrl != null
                            ? CachedNetworkImage(imageUrl: resolveImageUrl(c.coverUrl)!, width: 64, height: 64, fit: BoxFit.cover)
                            : Container(width: 64, height: 64, color: AppColors.surfaceGlass, child: const Icon(Icons.play_circle_outline_rounded, color: AppColors.textMuted)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.title, style: const TextStyle(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                            Text('${c.chapterCount} فصل · ${c.enrollmentCount} ثبت‌نام', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 12),
                        child: Text(c.isFree ? 'رایگان' : '${c.price.toStringAsFixed(0)} ت', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textSecondary),
                        onPressed: () => _showSheet(context, ref, course: c),
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

  void _showSheet(BuildContext context, WidgetRef ref, {Course? course}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _CourseEditSheet(course: course),
    );
  }
}

class _CourseEditSheet extends ConsumerStatefulWidget {
  final Course? course;
  const _CourseEditSheet({this.course});
  @override
  ConsumerState<_CourseEditSheet> createState() => _CourseEditSheetState();
}

class _CourseEditSheetState extends ConsumerState<_CourseEditSheet> {
  late final _titleCtrl = TextEditingController(text: widget.course?.title);
  late final _descCtrl = TextEditingController(text: widget.course?.description);
  late final _priceCtrl = TextEditingController(text: widget.course?.price.toStringAsFixed(0));
  String? _coverUrl;
  bool _isFree = false;
  bool _saving = false;
  bool _uploading = false;

  bool get _isEdit => widget.course != null;

  @override
  void initState() {
    super.initState();
    _coverUrl = widget.course?.coverUrl;
    _isFree = widget.course?.isFree ?? false;
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
    setState(() => _saving = true);
    final body = {
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'price': num.tryParse(_priceCtrl.text) ?? 0,
      'isFree': _isFree,
      if (_coverUrl != null) 'coverUrl': _coverUrl,
    };
    try {
      if (_isEdit) {
        await ref.read(coursesProvider.notifier).updateItem(widget.course!.id, body);
      } else {
        await ref.read(coursesProvider.notifier).create(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(coursesProvider.notifier).deleteItem(widget.course!.id);
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
            Text(_isEdit ? 'ویرایش دوره' : 'دوره جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _uploading ? null : _pickCover,
              child: Container(
                height: 110,
                decoration: BoxDecoration(color: AppColors.surfaceGlass, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: _uploading
                    ? const Center(child: CircularProgressIndicator())
                    : _coverUrl != null
                        ? ClipRRect(borderRadius: BorderRadius.circular(16), child: CachedNetworkImage(imageUrl: resolveImageUrl(_coverUrl)!, fit: BoxFit.cover, width: double.infinity))
                        : const Center(child: Text('افزودن عکس کاور (۱۲۸۰×۷۲۰)', style: TextStyle(color: AppColors.textMuted, fontSize: 12))),
              ),
            ),
            const SizedBox(height: 12),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان دوره')),
            const SizedBox(height: 12),
            TextField(controller: _descCtrl, maxLines: 3, decoration: const InputDecoration(hintText: 'توضیحات')),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Text('رایگان', style: Theme.of(context).textTheme.bodyMedium)),
              Switch(value: _isFree, activeColor: AppColors.accent, onChanged: (v) => setState(() => _isFree = v)),
            ]),
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
              TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف دوره')),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
