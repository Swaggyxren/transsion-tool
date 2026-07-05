# Maintainer: Transsion Tool Contributors <transsion-tool@example.com>
pkgname=transsion-tool
pkgver=1.0.0
pkgrel=1
pkgdesc="Desktop servicing tool for Transsion Android devices (Tecno, Infinix, Itel)"
arch=('x86_64')
url="https://github.com/example/transsion-tool"
license=('MIT')
depends=('android-tools' 'scrcpy' 'p7zip' 'gtk3' 'webkit2gtk')
makedepends=('cargo' 'nodejs' 'npm')
source=("$pkgname-$pkgver.tar.gz")
sha256sums=('SKIP')

build() {
    cd "$pkgname-$pkgver"
    npm install
    npm run tauri build
}

package() {
    cd "$pkgname-$pkgver"
    install -Dm755 "src-tauri/target/release/$pkgname" "$pkgdir/usr/bin/$pkgname"
    install -Dm644 "src-tauri/target/release/bundle/appimage/*.AppImage" "$pkgdir/opt/$pkgname/$pkgname.AppImage" 2>/dev/null || true
    install -Dm644 "README.md" "$pkgdir/usr/share/doc/$pkgname/README.md"
}
