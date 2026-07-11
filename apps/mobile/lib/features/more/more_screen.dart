import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

typedef _Item = ({IconData icon, String label, String route});

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  static const _sections = <(String, List<_Item>)>[
    ('فروش و محتوا', [
      (icon: Icons.local_offer_outlined, label: 'کدهای تخفیف', route: '/more/coupons'),
      (icon: Icons.description_outlined, label: 'فایل‌های دیجیتال', route: '/more/digital-files'),
      (icon: Icons.bolt_outlined, label: 'فلش‌سیل', route: '/more/flash-sale'),
      (icon: Icons.school_outlined, label: 'دوره‌های آموزشی', route: '/more/courses'),
      (icon: Icons.event_available_outlined, label: 'نوبت‌دهی', route: '/more/appointments'),
    ]),
    ('رشد و بازاریابی', [
      (icon: Icons.dashboard_customize_outlined, label: 'قالب‌های آماده', route: '/more/templates'),
      (icon: Icons.qr_code_2_rounded, label: 'کد QR فروشگاه', route: '/more/qrcode'),
      (icon: Icons.link_rounded, label: 'لینک کوتاه', route: '/more/short-links'),
      (icon: Icons.handshake_outlined, label: 'همکاری در فروش', route: '/more/affiliate'),
      (icon: Icons.smart_toy_outlined, label: 'پاسخ خودکار', route: '/more/auto-reply'),
      (icon: Icons.science_outlined, label: 'تست A/B', route: '/more/ab-testing'),
    ]),
    ('مخاطبین و برنامه‌ریزی', [
      (icon: Icons.groups_outlined, label: 'مخاطبین', route: '/more/audience'),
      (icon: Icons.calendar_month_outlined, label: 'تقویم محتوایی', route: '/more/content-calendar'),
    ]),
    ('حساب کاربری', [
      (icon: Icons.storefront_rounded, label: 'پروفایل فروشگاه', route: '/more/shop'),
      (icon: Icons.workspace_premium_rounded, label: 'اشتراک و پلن‌ها', route: '/more/plans'),
      (icon: Icons.person_outline_rounded, label: 'حساب کاربری', route: '/more/account'),
    ]),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('بیشتر')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          for (final section in _sections) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 8, right: 4),
              child: Text(section.$1, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
            ),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (int i = 0; i < section.$2.length; i++) ...[
                    if (i > 0) const Divider(height: 1, indent: 16, endIndent: 16),
                    _MoreTile(item: section.$2[i]),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ],
      ),
    );
  }
}

class _MoreTile extends StatelessWidget {
  final _Item item;
  const _MoreTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(item.route),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(item.icon, color: AppColors.accent, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text(item.label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
              const Icon(Icons.arrow_back_ios_new_rounded, size: 12, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 200.ms);
  }
}
