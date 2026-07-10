import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class ProductsScreen extends ConsumerWidget {
  const ProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('محصولات')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showEditSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: productsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (products) {
          if (products.isEmpty) {
            return const Center(child: Text('هنوز محصولی اضافه نکرده‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.75,
            ),
            itemCount: products.length,
            itemBuilder: (context, i) {
              final p = products[i];
              return _ProductCard(product: p, onTap: () => _showEditSheet(context, ref, product: p))
                  .animate().fadeIn(delay: (i * 60).ms).scale(begin: const Offset(0.9, 0.9));
            },
          );
        },
      ),
    );
  }

  void _showEditSheet(BuildContext context, WidgetRef ref, {Product? product}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _ProductEditSheet(product: product),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  const _ProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: product.images.isNotEmpty
                  ? CachedNetworkImage(imageUrl: product.images.first, fit: BoxFit.cover, width: double.infinity)
                  : Container(color: AppColors.surfaceGlass, child: const Icon(Icons.image_outlined, color: AppColors.textMuted, size: 32)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 4),
                Text('${_formatToman(product.price)} تومان', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatToman(num v) {
    final s = v.toStringAsFixed(0);
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

class _ProductEditSheet extends ConsumerStatefulWidget {
  final Product? product;
  const _ProductEditSheet({this.product});

  @override
  ConsumerState<_ProductEditSheet> createState() => _ProductEditSheetState();
}

class _ProductEditSheetState extends ConsumerState<_ProductEditSheet> {
  late final _nameCtrl = TextEditingController(text: widget.product?.name);
  late final _priceCtrl = TextEditingController(text: widget.product?.price.toStringAsFixed(0));
  late final _descCtrl = TextEditingController(text: widget.product?.description);
  String? _imageUrl;
  bool _saving = false;
  bool _uploading = false;

  bool get _isEdit => widget.product != null;

  @override
  void initState() {
    super.initState();
    _imageUrl = widget.product?.images.isNotEmpty == true ? widget.product!.images.first : null;
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

  Future<void> _save() async {
    final price = num.tryParse(_priceCtrl.text.trim());
    if (_nameCtrl.text.trim().isEmpty || price == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('نام و قیمت را درست وارد کنید')));
      return;
    }
    setState(() => _saving = true);
    final body = {
      'name': _nameCtrl.text.trim(),
      'price': price,
      'description': _descCtrl.text.trim(),
      if (_imageUrl != null) 'images': [_imageUrl],
    };
    try {
      if (_isEdit) {
        await ref.read(productsProvider.notifier).updateProduct(widget.product!.id, body);
      } else {
        await ref.read(productsProvider.notifier).createProduct(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    if (widget.product == null) return;
    await ref.read(productsProvider.notifier).deleteProduct(widget.product!.id);
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
            Text(_isEdit ? 'ویرایش محصول' : 'محصول جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _uploading ? null : _pickImage,
              child: Container(
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.surfaceGlass,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                ),
                child: _uploading
                    ? const Center(child: CircularProgressIndicator())
                    : _imageUrl != null
                        ? ClipRRect(borderRadius: BorderRadius.circular(16), child: CachedNetworkImage(imageUrl: _imageUrl!, fit: BoxFit.cover, width: double.infinity))
                        : const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                            Icon(Icons.add_photo_alternate_outlined, color: AppColors.textMuted, size: 28),
                            SizedBox(height: 6),
                            Text('افزودن عکس محصول (۸۰۰×۸۰۰)', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          ])),
              ),
            ),
            const SizedBox(height: 12),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'نام محصول')),
            const SizedBox(height: 12),
            TextField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'قیمت (تومان)')),
            const SizedBox(height: 12),
            TextField(controller: _descCtrl, maxLines: 3, decoration: const InputDecoration(hintText: 'توضیحات (اختیاری)')),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
            ),
            if (_isEdit) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف محصول')),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
