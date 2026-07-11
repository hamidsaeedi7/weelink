import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class BlocksScreen extends ConsumerWidget {
  const BlocksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blocksAsync = ref.watch(blocksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('لینک‌ها')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showEditSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: blocksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (blocks) {
          if (blocks.isEmpty) {
            return const Center(
              child: Text('هنوز لینکی اضافه نکرده‌اید — دکمه + را بزنید', style: TextStyle(color: AppColors.textMuted)),
            );
          }
          return ReorderableListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: blocks.length,
            onReorder: (oldIndex, newIndex) {
              if (newIndex > oldIndex) newIndex -= 1;
              final ids = blocks.map((b) => b.id).toList();
              final id = ids.removeAt(oldIndex);
              ids.insert(newIndex, id);
              ref.read(blocksProvider.notifier).reorder(ids);
            },
            itemBuilder: (context, i) {
              final b = blocks[i];
              // ReorderableListView کلید را از خودِ ویجت بازگشتی می‌خواهد؛ animate()
              // یک ویجت جدید دور آن می‌سازد، پس کلید باید روی بیرونی‌ترین لایه (KeyedSubtree) باشد
              return KeyedSubtree(
                key: ValueKey(b.id),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _BlockTile(block: b, onTap: () => _showEditSheet(context, ref, block: b)),
                ).animate().fadeIn(delay: (i * 40).ms),
              );
            },
          );
        },
      ),
    );
  }

  void _showEditSheet(BuildContext context, WidgetRef ref, {LinkBlock? block}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _BlockEditSheet(block: block),
    );
  }
}

class _BlockTile extends ConsumerWidget {
  final LinkBlock block;
  final VoidCallback onTap;
  const _BlockTile({required this.block, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GlassCard(
      onTap: onTap,
      child: Row(
        children: [
          const Icon(Icons.drag_indicator_rounded, color: AppColors.textMuted),
          const SizedBox(width: 8),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.link_rounded, color: AppColors.accent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(block.label?.isNotEmpty == true ? block.label! : block.type,
                    style: const TextStyle(fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
                if (block.url != null)
                  Text(block.url!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12), overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Switch(
            value: block.isActive,
            activeThumbColor: AppColors.accent,
            onChanged: (_) => ref.read(blocksProvider.notifier).toggleActive(block),
          ),
        ],
      ),
    );
  }
}

class _BlockEditSheet extends ConsumerStatefulWidget {
  final LinkBlock? block;
  const _BlockEditSheet({this.block});

  @override
  ConsumerState<_BlockEditSheet> createState() => _BlockEditSheetState();
}

class _BlockEditSheetState extends ConsumerState<_BlockEditSheet> {
  late final _labelCtrl = TextEditingController(text: widget.block?.label);
  late final _urlCtrl = TextEditingController(text: widget.block?.url);
  bool _saving = false;

  bool get _isEdit => widget.block != null;

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      if (_isEdit) {
        await ref.read(blocksProvider.notifier).updateBlock(widget.block!.id, label: _labelCtrl.text, url: _urlCtrl.text);
      } else {
        await ref.read(blocksProvider.notifier).createBlock(type: 'LINK', label: _labelCtrl.text, url: _urlCtrl.text);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    if (widget.block == null) return;
    await ref.read(blocksProvider.notifier).deleteBlock(widget.block!.id);
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
          Text(_isEdit ? 'ویرایش لینک' : 'لینک جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          TextField(controller: _labelCtrl, decoration: const InputDecoration(hintText: 'عنوان لینک')),
          const SizedBox(height: 12),
          TextField(controller: _urlCtrl, textDirection: TextDirection.ltr, decoration: const InputDecoration(hintText: 'آدرس (URL)')),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
          ),
          if (_isEdit) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: _delete,
              style: TextButton.styleFrom(foregroundColor: AppColors.danger),
              child: const Text('حذف لینک'),
            ),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
