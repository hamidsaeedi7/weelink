import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';

class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key});
  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  final _nameCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  String? _avatarUrl;
  bool _saving = false;
  bool _uploading = false;
  bool _loaded = false;

  Future<void> _pickAvatar() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    setState(() => _uploading = true);
    try {
      final url = await ApiClient.instance.uploadImage(picked.path);
      setState(() => _avatarUrl = url);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.instance.put('/me/shop', body: {
        'name': _nameCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
        if (_avatarUrl != null) 'avatarUrl': _avatarUrl,
      });
      ref.invalidate(shopProvider);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ذخیره شد')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shopAsync = ref.watch(shopProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('پروفایل فروشگاه')),
      body: shopAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (shop) {
          if (!_loaded) {
            _nameCtrl.text = shop.name;
            _bioCtrl.text = shop.bio ?? '';
            _avatarUrl = shop.avatarUrl;
            _loaded = true;
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: GestureDetector(
                  onTap: _uploading ? null : _pickAvatar,
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 48,
                        backgroundColor: AppColors.surfaceGlass,
                        backgroundImage: _avatarUrl != null ? CachedNetworkImageProvider(resolveImageUrl(_avatarUrl)!) : null,
                        child: _uploading
                            ? const CircularProgressIndicator()
                            : (_avatarUrl == null ? const Icon(Icons.storefront_rounded, size: 36, color: AppColors.textMuted) : null),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                          child: const Icon(Icons.camera_alt_rounded, size: 14, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text('weeelink.ir/${shop.slug}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12), textDirection: TextDirection.ltr),
              ),
              const SizedBox(height: 24),
              const Text('نام فروشگاه', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              TextField(controller: _nameCtrl),
              const SizedBox(height: 16),
              const Text('بیوگرافی', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              TextField(controller: _bioCtrl, maxLines: 3),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره تغییرات'),
              ),
            ],
          );
        },
      ),
    );
  }
}
