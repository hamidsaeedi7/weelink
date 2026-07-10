import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme.dart';
import 'features/account/account_screen.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/splash_screen.dart';
import 'features/blocks/blocks_screen.dart';
import 'features/home/home_screen.dart';
import 'features/more/more_screen.dart';
import 'features/orders/orders_screen.dart';
import 'features/plans/plans_screen.dart';
import 'features/products/products_screen.dart';
import 'features/shop/shop_screen.dart';
import 'widgets/shell_scaffold.dart';

const _tabs = ['/home', '/blocks', '/products', '/orders', '/more'];

final _routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: _AuthListenable(ref),
    redirect: (context, state) {
      final status = ref.read(authProvider).status;
      final loc = state.matchedLocation;
      if (status == AuthStatus.unknown) return loc == '/splash' ? null : '/splash';
      if (status == AuthStatus.unauthenticated) return loc == '/login' ? null : '/login';
      if (status == AuthStatus.authenticated && (loc == '/login' || loc == '/splash')) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) {
          final index = _tabs.indexWhere((t) => state.matchedLocation.startsWith(t));
          return ShellScaffold(
            currentIndex: index < 0 ? 0 : index,
            onTap: (i) => context.go(_tabs[i]),
            child: child,
          );
        },
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
          GoRoute(path: '/blocks', builder: (context, state) => const BlocksScreen()),
          GoRoute(path: '/products', builder: (context, state) => const ProductsScreen()),
          GoRoute(path: '/orders', builder: (context, state) => const OrdersScreen()),
          GoRoute(
            path: '/more',
            builder: (context, state) => const MoreScreen(),
            routes: [
              GoRoute(path: 'shop', builder: (context, state) => const ShopScreen()),
              GoRoute(path: 'plans', builder: (context, state) => const PlansScreen()),
              GoRoute(path: 'account', builder: (context, state) => const AccountScreen()),
            ],
          ),
        ],
      ),
    ],
  );
});

/// پل بین Riverpod state و Listenable مورد نیاز go_router برای redirect خودکار
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

class WeelinkApp extends ConsumerWidget {
  const WeelinkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(_routerProvider);
    return MaterialApp.router(
      title: 'ویلینک',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: router,
      locale: const Locale('fa', 'IR'),
      supportedLocales: const [Locale('fa', 'IR'), Locale('en', 'US')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
