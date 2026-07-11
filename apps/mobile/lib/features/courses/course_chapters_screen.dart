import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class CourseChaptersScreen extends ConsumerWidget {
  final Course course;
  const CourseChaptersScreen({super.key, required this.course});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chaptersAsync = ref.watch(courseChaptersProvider(course.id));
    return Scaffold(
      appBar: AppBar(title: Text(course.title)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: chaptersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (chapters) {
          if (chapters.isEmpty) {
            return const Center(child: Text('هنوز فصلی اضافه نکرده‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: chapters.length,
            itemBuilder: (context, i) {
              final ch = chapters[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => _showSheet(context, ref, chapter: ch),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                          child: Center(child: Text('${i + 1}', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12))),
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(ch.title, style: const TextStyle(fontWeight: FontWeight.w700))),
                        Text('${ch.videos.length} ویدیو', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ]),
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

  void _showSheet(BuildContext context, WidgetRef ref, {CourseChapter? chapter}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _ChapterEditSheet(courseId: course.id, chapter: chapter),
    );
  }
}

class _ChapterEditSheet extends ConsumerStatefulWidget {
  final String courseId;
  final CourseChapter? chapter;
  const _ChapterEditSheet({required this.courseId, this.chapter});
  @override
  ConsumerState<_ChapterEditSheet> createState() => _ChapterEditSheetState();
}

class _ChapterEditSheetState extends ConsumerState<_ChapterEditSheet> {
  late final _titleCtrl = TextEditingController(text: widget.chapter?.title);
  late List<CourseVideo> _videos = List.of(widget.chapter?.videos ?? []);
  bool _saving = false;

  bool get _isEdit => widget.chapter != null;

  void _addVideoRow() => setState(() => _videos.add(CourseVideo(title: '', videoUrl: '')));

  Future<void> _save() async {
    setState(() => _saving = true);
    final body = {
      'title': _titleCtrl.text.trim(),
      'videos': _videos.where((v) => v.title.isNotEmpty || v.videoUrl.isNotEmpty).map((v) => v.toJson()).toList(),
    };
    try {
      final notifier = ref.read(courseChaptersProvider(widget.courseId).notifier);
      if (_isEdit) {
        await notifier.updateItem(widget.chapter!.id, body);
      } else {
        await notifier.create(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(courseChaptersProvider(widget.courseId).notifier).deleteItem(widget.chapter!.id);
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
            Text(_isEdit ? 'ویرایش فصل' : 'فصل جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان فصل')),
            const SizedBox(height: 16),
            Row(children: [
              const Text('ویدیوها', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const Spacer(),
              TextButton.icon(onPressed: _addVideoRow, icon: const Icon(Icons.add, size: 16), label: const Text('افزودن ویدیو')),
            ]),
            for (int i = 0; i < _videos.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(children: [
                        Expanded(
                          child: TextFormField(
                            initialValue: _videos[i].title,
                            decoration: const InputDecoration(hintText: 'عنوان ویدیو', isDense: true),
                            onChanged: (v) => _videos[i].title = v,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 16, color: AppColors.danger),
                          onPressed: () => setState(() => _videos.removeAt(i)),
                        ),
                      ]),
                      const SizedBox(height: 6),
                      TextFormField(
                        initialValue: _videos[i].videoUrl,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(hintText: 'آدرس فایل ویدیو (URL)', isDense: true),
                        onChanged: (v) => _videos[i].videoUrl = v,
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
            ),
            if (_isEdit) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف فصل')),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
