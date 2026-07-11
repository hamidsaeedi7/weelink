import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class AffiliateScreen extends ConsumerWidget {
  const AffiliateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final linksAsync = ref.watch(affiliateProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('همکاری در فروش')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: linksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (links) {
          if (links.isEmpty) {
            return const Center(child: Text('هنوز لینک افیلیت نساخته‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: links.length,
            itemBuilder: (context, i) {
              final l = links[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => _showSheet(context, ref, link: l),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(l.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text(l.originalUrl, style: const TextStyle(color: AppColors.textMuted, fontSize: 11), overflow: TextOverflow.ellipsis, textDirection: TextDirection.ltr),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${l.clickCount} کلیک', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          Text('${l.earnings.toStringAsFixed(0)} ت', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.success, fontSize: 12)),
                        ],
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

  void _showSheet(BuildContext context, WidgetRef ref, {AffiliateLink? link}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _AffiliateEditSheet(link: link),
    );
  }
}

class _AffiliateEditSheet extends ConsumerStatefulWidget {
  final AffiliateLink? link;
  const _AffiliateEditSheet({this.link});
  @override
  ConsumerState<_AffiliateEditSheet> createState() => _AffiliateEditSheetState();
}

class _AffiliateEditSheetState extends ConsumerState<_AffiliateEditSheet> {
  late final _titleCtrl = TextEditingController(text: widget.link?.title);
  late final _urlCtrl = TextEditingController(text: widget.link?.originalUrl);
  late final _commissionCtrl = TextEditingController(text: widget.link?.commission.toString());
  bool _saving = false;

  bool get _isEdit => widget.link != null;

  Future<void> _save() async {
    setState(() => _saving = true);
    final body = {
      'title': _titleCtrl.text.trim(),
      'originalUrl': _urlCtrl.text.trim(),
      'commission': num.tryParse(_commissionCtrl.text) ?? 0,
    };
    try {
      if (_isEdit) {
        await ref.read(affiliateProvider.notifier).updateItem(widget.link!.id, body);
      } else {
        await ref.read(affiliateProvider.notifier).create(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(affiliateProvider.notifier).deleteItem(widget.link!.id);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(_isEdit ? 'ویرایش لینک افیلیت' : 'لینک افیلیت جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان')),
          const SizedBox(height: 12),
          TextField(controller: _urlCtrl, textDirection: TextDirection.ltr, decoration: const InputDecoration(hintText: 'آدرس مقصد (URL)')),
          const SizedBox(height: 12),
          TextField(controller: _commissionCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'درصد/مبلغ کمیسیون')),
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
    );
  }
}
