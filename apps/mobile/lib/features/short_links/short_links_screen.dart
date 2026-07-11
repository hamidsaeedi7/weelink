import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';

const _shortDomain = 'weeelink.ir/s';

class ShortLinksScreen extends ConsumerWidget {
  const ShortLinksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final linksAsync = ref.watch(shortLinksProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('لینک کوتاه')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: linksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (links) {
          if (links.isEmpty) {
            return const Center(child: Text('هنوز لینک کوتاهی نساخته‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: links.length,
            itemBuilder: (context, i) {
              final l = links[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(l.title?.isNotEmpty == true ? l.title! : l.shortCode,
                                style: const TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 3),
                            Text('$_shortDomain/${l.shortCode}',
                                style: const TextStyle(color: AppColors.accent, fontSize: 12), textDirection: TextDirection.ltr),
                            Text(l.originalUrl,
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                overflow: TextOverflow.ellipsis, textDirection: TextDirection.ltr),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          Text('${l.clickCount}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accent)),
                          const Text('کلیک', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy_rounded, size: 18, color: AppColors.textSecondary),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: 'https://$_shortDomain/${l.shortCode}'));
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('کپی شد')));
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.danger),
                        onPressed: () => ref.read(shortLinksProvider.notifier).deleteItem(l.id),
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

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _CreateShortLinkSheet(),
    );
  }
}

class _CreateShortLinkSheet extends ConsumerStatefulWidget {
  const _CreateShortLinkSheet();
  @override
  ConsumerState<_CreateShortLinkSheet> createState() => _CreateShortLinkSheetState();
}

class _CreateShortLinkSheetState extends ConsumerState<_CreateShortLinkSheet> {
  final _urlCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  bool _saving = false;
  String? _error;

  Future<void> _save() async {
    if (_urlCtrl.text.trim().isEmpty) {
      setState(() => _error = 'آدرس را وارد کنید');
      return;
    }
    setState(() { _saving = true; _error = null; });
    try {
      await ref.read(shortLinksProvider.notifier).create({
        'originalUrl': _urlCtrl.text.trim(),
        if (_titleCtrl.text.trim().isNotEmpty) 'title': _titleCtrl.text.trim(),
        if (_codeCtrl.text.trim().isNotEmpty) 'shortCode': _codeCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('لینک کوتاه جدید', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          TextField(controller: _urlCtrl, textDirection: TextDirection.ltr, decoration: const InputDecoration(hintText: 'آدرس مقصد (URL)')),
          const SizedBox(height: 12),
          TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان (اختیاری)')),
          const SizedBox(height: 12),
          TextField(controller: _codeCtrl, textDirection: TextDirection.ltr, decoration: const InputDecoration(hintText: 'کد دلخواه (اختیاری)')),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: AppColors.danger))),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ساخت لینک'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
