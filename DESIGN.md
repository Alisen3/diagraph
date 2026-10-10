# DiaGraph web sitesi: tasarım ve animasyon notları

Bu belge sitenin görsel kararlarını, token'ları ve animasyonların nasıl kurulduğunu anlatır. Kod değiştikçe bu belgeyi de güncelleyin.

## 1. Genel yaklaşım

- **Görsel dil:** `ui/DESIGN.md` içindeki tasarım sisteminden alındı. Saf siyah zemin, tek bir mor aksiyon rengi, amber vurgular. Kart, çerçeve ve gölge yok; öğeler aralarındaki boşlukla ayrılıyor.
- **Ana görsel:** Parçacıklardan oluşan bir 3B sahne. Sayfa boyunca kaydırdıkça beyin, insan bedeni ve bilgi grafı arasında dönüşüyor. Her şekil projenin bir yanını anlatıyor:
  - **Beyin:** tıbbi bilgi
  - **Beden:** hasta
  - **Graf:** DiaGraph'ın kendisi
- **Referans:** Sayfa yapısı ve hareket dili referans bir siteden (Dala) esinlendi. Onların adı, logosu, metinleri ve görselleri kullanılmadı; yalnızca stil ve mekanikler uyarlandı.
- **Teknoloji:** Next.js 16 (App Router, statik çıktı) ve Three.js. Backend yok.

## 2. Token'lar

Tüm token'lar `app/globals.css` dosyasının başında, `:root` içinde.

### Renkler

| Token | Koyu tema | Açık tema | Rol |
|---|---|---|---|
| `--color-void` | `#000000` | `#ffffff` | Sayfa zemini |
| `--color-bone-white` | `#ffffff` | `#0a0a0a` | Ana yazı rengi |
| `--color-ash-gray` | `#9a9a9a` | `#6b6b6b` | İkincil yazı, pasif nav linkleri |
| `--color-silver-mist` | `#bdbdbd` | `#4a4a4a` | Üçüncül yazı, açıklamalar |
| `--color-electric-iris` | `#8052ff` | `#8052ff` | Sadece dolu aksiyon butonları, numaralar ve ekip rolleri |
| `--color-saffron-spark` | `#ffb829` | `#b87400` | Etiketler, vurgular, ağrı noktası |
| `--color-deep-verdant` | `#15846e` | `#15846e` | Logo gradyanı, fotoğrafı olmayan ekip kartlarının zemini |
| `--faint` | `rgba(255,255,255,.14)` | `rgba(0,0,0,.12)` | Sadece veri görselleştirme: çubuk izleri, pasif kenarlar |

Açık temada token adları aynı kalır, yalnızca değerleri değişir. `void` her iki temada da "sayfa rengi", `bone-white` ise "yazı rengi" demektir. Amber, beyaz zeminde okunabilsin diye açık temada koyulaştırıldı.

**Renk kuralları:**
- Mor yalnızca dolu butonlarda kullanılır, yüzey ya da arka plan olarak kullanılmaz.
- Bir ekranda birden fazla dolu mor buton olmaz.
- Linkler varsayılan mavi değildir; amber ya da yazı rengindedir.
- Arayüz bileşenlerinde gradyan yoktur. Gradyan sadece logoda ve parçacık sahnesinde bulunur.

### Yazı

- **Font:** Inter (`next/font/google`, `--font-sans`). Tasarım sistemi PP Neue Montreal istiyor, ama o font ücretli olduğu için sistemin önerdiği yedek olan Inter kullanılıyor. `font-feature-settings: "ss01"` açık.
- **Ağırlıklar:**
  - Başlıklar her boyutta **400**; hiyerarşi kalınlıkla değil boyutla kuruluyor.
  - Gövde metni **200** (ultra ince). Tasarım sisteminin imza kararı budur.
  - Etiketler ve nav **600**, büyük harf, `0.025em` harf aralığı.
- **Harf aralığı:** 42px ve üzeri başlıklarda `-0.04em`.

| Token | Boyut | Kullanım |
|---|---|---|
| `--text-caption` | 12px | Graf etiketleri, ekip rolleri, dipnotlar |
| `--text-nav-label` | 14px | Nav, butonlar, amber etiketler |
| `--text-body` | 18px | Gövde metni |
| `--text-heading-2xs` | 24px | Alıntılar, adım başlıkları |
| `--text-heading-xs` | 27px | Ekip isimleri |
| `--text-heading` | 48px | Metrik değerleri |
| `--text-heading-lg` | 78px | Bölüm başlıkları (`.block h2`, `clamp(40px, 5.4vw, 78px)`) |
| `--text-display` | 113px | Hero, ilke cümlesi ve kapanış (`.display`, `clamp(44px, 6.4vw, 113px)`) |

### Boşluk, köşe ve yerleşim

- **Boşluk:** Taban birimi 6px. Ölçek: `--spacing-6, 12, 18, 24, 30, 36, 60, 96, 120`.
- **Köşe:** `--radius-3xl: 24px` (butonlar, ekip portreleri) ve `--radius-full` (tema butonu).
- **Sayfa genişliği:** `--page-max-width: 1280px`, yan boşluk 36px (mobilde 16px).

## 3. Sayfa yapısı

Bölümler sırasıyla:

| Bölüm | `data-scene` | Yerleşim |
|---|---|---|
| Hero | `hero` | Solda dev başlık, sağda beyin |
| Records are scattered (problem) | `intro` | Metin solda |
| Understand your own record | `patients` | Metin sağda |
| Reason with evidence | `clinicians` | Metin solda |
| Timing carries diagnostic information | `case` | Metin sağda, altta etkileşimli vaka |
| The model proposes | `how` | Dev başlık, tek sütun metin solda |
| Built for health data | `privacy` | Metin sağda |
| Measured, not assumed | `measure` | Metin solda, altta metrik ızgarası |
| Two semesters | `plan` | Metin sağda |
| Our team | `team` | Ekip karuseli |
| Kapanış | `closing` | "One record, two views." ve GitHub bağlantısı |

**Yerleşim kuralları:**
- **Zikzak:** Uzun bölümlerde (`.tall`, en az 120svh) metin bloğu (`.block`) bir solda bir sağda (`.block.right`) durur. Parçacık şekli her zaman metnin karşı tarafına yerleşir.
- **Kart yok:** İçerik boşlukla ayrılır.
- **Etiketler:** Bölüm etiketleri amber, büyük harfli ve 14px'tir.

## 4. Bileşenler

- **Nav:** Saydam. Solda logo; sağda büyük harfli linkler, tema butonu ve mor GitHub butonu. Mobilde linkler gizlenir.
- **`.pill`:** Dolu mor buton, 24px köşe, büyük harf 14px/600. Yazı rengi her temada beyaz.
- **`.ghost`:** Kutusuz metin butonu (Previous/Next, Start over, tema).
- **Logo:** Mordan yeşile gradyanlı bir üçgen. Favicon `app/icon.svg`.
- **Vaka demosu (`app/case-demo.tsx`):** Hasta zaman çizelgesi, SVG bilgi grafı ve klinisyen tanı listesi yan yana. "Add the next finding" her basışta bir bulgu ekler; graftaki eşleşen düğüm amberle yanar, tanı çubukları animasyonla yeniden sıralanır, bir sonraki soru güncellenir. Sayılar örnektir.
- **Ekip karuseli (`TeamCarousel`, `app/motion.tsx`):**
  - Şerit ekranın iki kenarına kadar uzanır; `--gutter` iç boşluğu ilk kartı içerik sütunuyla hizalar.
  - Devamı olan kenarda `mask-image` ile solma vardır.
  - Butonlar tam bir kart kaydırır ve uçlarda devre dışı kalır.
  - İsim satırının yüksekliği 1.3, şeridin alt boşluğu 24px; böylece harf kuyrukları (y, g, Ş) kırpılmaz.
- **Ekip fotoğrafları:** `public/team/` altında, 600×750 (4:5), EXIF verisi silinmiş. `TEAM` dizisinde üçüncü alan fotoğraf yoludur; fotoğrafı olmayan kişide baş harfler görünür.

## 5. Animasyonlar

### 5.1 Kelime kelime belirme (`Words`, `RevealObserver`)

- **Bölme:** Başlıklar `Words` bileşeniyle kelimelere bölünür. Her kelime `overflow: hidden` bir maske içindedir ve iç `span` aşağıdan (`translateY(105%)`) yukarı kayar.
- **Zamanlama:** 1.1 saniye, `cubic-bezier(0.16, 1, 0.3, 1)`. Her kelimede 45ms gecikme artar (`--i` CSS değişkeni).
- **Tetikleme:** `RevealObserver`, `.reveal` sınıflı öğeleri `IntersectionObserver` ile izler (eşik 0.15) ve görünür olunca `.in` ekler. Paragraflar ve `.fade` öğeler 24px aşağıdan solarak gelir.
- **Hero:** Yükleme ekranı yok; hero başlığı sayfa açılır açılmaz kelime kelime gelir, "Scroll to explore" 1 saniye sonra belirir.
- **JavaScript olmadan:** Gizleme sadece `<html class="js">` varsa uygulanır, yani JavaScript yoksa içerik görünür kalır.

### 5.2 Parçacık sahnesi (`app/particle-scene.tsx`)

Tüm sayfanın arkasında `position: fixed` bir WebGL tuvali var (`.brain-scene`, z-index 0, `pointer-events: none`). İçerik ondan önce gelir (z-index 1).

**Geometri:**
- Her parçacık, kenarları çizilmiş bir dörtyüzlüdür (`EdgesGeometry(TetrahedronGeometry)`). Hepsi tek çizimde `InstancedBufferGeometry` ile basılır.
- Parçacık sayısı masaüstünde 4200, mobilde 2400. Boyut `uSize = 0.03`.

**Her parçacığın öznitelikleri:**

| Öznitelik | İçerik |
|---|---|
| `aBrain`, `aBody`, `aGraph` | Üç şekildeki konumu (hepsi kabaca [-1, 1] kutusunda, y yukarı) |
| `aScatter` | Dağılmış haldeki konumu (kameranın etrafında geniş bir kutu) |
| `aRand` | 4 rastgele sayı: dağılma sırası, titreşim fazları, boyut |
| `aColor` | Rengi; tema değişince güncellenir |

**Şekillerin üretimi:** Hepsi rastgele örneklemeyle, kod içinde üretilir. Model dosyası yok.

- **Beyin (`sampleBrain`):**
  - Elipsoidlerden kurulmuş bir hacim: beyin kabuğu, şakak lobları, beyincik, beyin sapı. İki yarıküre arasında bir yarık var.
  - Parçacıkların çoğu yüzeyde. Yüzey yoğunluğu sinüs desenleriyle modüle edilir; bu kıvrımları (girus/sulkus) oluşturur.
  - Her iki yanda Sylvian yarığı boş bırakılır.
  - İçeriye yaklaşık %10 dolgu konur ki şekil simit gibi değil, dolu bir hacim gibi görünsün.
- **Beden (`sampleBody`):** Kapsüllerden (iki uçlu yuvarlatılmış silindirler) kurulmuş ayakta bir insan: baş, boyun, gövde, pelvis; kollar ve bacaklar aynalanır. Mesafe fonksiyonu (`bodyDistance`) ile parçacıklar "deriye" yerleştirilir, içeriye hafif bir dolgu eklenir.
- **Graf (`sampleGraph`):** Yedi kavram kümesi (Acute appendicitis, Abdominal pain, Fever, Nausea, Leukocytosis, Gastroenteritis, Peritonitis). Parçacıkların %62'si kümelerde, gerisi kümeler arasındaki 12 kenar boyunca.
- **Beyin içindeki ağ:** Beyin parçacıkları arasından en uzak nokta örneklemesiyle (farthest-point sampling) 110 düğüm seçilir. Her düğüm en yakın 3 komşusuna çizgiyle bağlanır. Bu çizgiler ayrı bir `LineSegments` olarak çizilir ve sadece beyin şeklindeyken görünür.

**Renk:**
- Renkler parçacığa rastgele değil, bölge bölge verilir: konuma bağlı bir sinüs fonksiyonu yüzeyi renk parçalarına böler, parçacıkların %20'si ise rastgele renk alır.
- Koyu temada beyaz, lila, mor ve turkuaz; açık temada koyu lacivert, mor ve turkuaz kullanılır.
- Amber, kenar parıltısı için ayrılmıştır.

**Vertex shader'da yapılanlar:**

1. **Şekil karışımı:** `shape = aBrain*uW.x + aBody*uW.y + aGraph*uW.z`. `uW` üç şeklin ağırlığıdır; geçişlerde parçacıklar bir şekilden ötekine akar.
2. **Kademeli dağılma:**
   ```glsl
   float e = smoothstep(aRand.x*0.7, aRand.x*0.7 + 0.3, uExplode);
   vec3 c = mix(shape, aScatter, e);
   ```
   Her parçacık kendi sırası gelince kopar. `uExplode` arttıkça şekil bir bütün halinde kaymaz, parça parça ufalanır. Dağıldıktan sonra parçacıkların yalnızca yaklaşık %30'u soluk bir zemin olarak görünür kalır.
3. **Süzülme:** Her parçacık küçük bir sinüs titreşimiyle süzülür. Dağıldıkça titreşim büyür.
4. **İmleç efekti:** İmlece yakın parçacıklar (`near`, ekran uzayında 0.3 yarıçap) dışarı **itilmez**; bu, ortada karanlık bir delik bırakıyordu. Bunun yerine:
   - yerinde titreşirler (`stir`),
   - farenin hızıyla (`uDelta`) hareket yönüne savrulurlar,
   - %80'e kadar büyür ve beyaza (açık temada koyuya) doğru parlarlar.

   `uDelta` JavaScript'te farenin kareden kareye farkından hesaplanır, yumuşatılır ve her karede %8 söner.
5. **Kenar parıltısı:** Yüzey normali izleyiciden uzaklaştıkça (`rim = (1 - |n.z|)^2`) parçacık amber renge döner ve parlaklaşır. Normal, şekil konumundan yaklaşık olarak hesaplanır.
6. **Sahte alan derinliği:** Kameraya uzaklık odak düzleminden (z=6) saptıkça saydamlık 0.62'den 0.1'e iner. Öndeki ve arkadaki parçacıklar soluk, odaktakiler net görünür.
7. **Parçacık dönüşü:** Her dörtyüzlü kendi ekseni etrafında yavaşça döner.

**Kaydırma koreografisi:**
- Her bölüm `data-scene="..."` ile işaretlidir. Her bölüm için bir **poz** (`POSES`) tanımlı.
- Bir pozun alanları: şekil ağırlıkları, dağılma miktarı, x/y konumu, dönüş açıları, ölçek, ağrı noktasının ilerlemesi ve genel opaklık (`fade`, varsayılan 1).

| Poz | Şekil | Dağılma | x | Not |
|---|---|---|---|---|
| hero | beyin | 0 | 1.75 | Başlığın sağında, üç çeyrek açı (`rotY 0.55`) |
| intro | beyin | 0.35 | 1.9 | Önce ters yöne döner (`rotY -0.8`), sonra ufalanmaya başlar |
| patients | beden | 0 | -2.2 | Ağrı göbek çevresinde |
| clinicians | beden | 0 | 2.2 | Ağrı sağ alt karına kayar |
| case | beden | 1 | 0 | Dağılır ve `fade: 0.2` ile soluklaşır. Demo kutusu da `data-scene="case"` taşır, böylece sahne demo ekranın ortasına gelene kadar sakin kalır |
| how | graf | 0 | 2.1 | Metin solda, graf sağda |
| privacy | graf | 0 | -2.1 | |
| measure | graf | 0.9 | 0 | Metriklerin arkasında dağınık |
| plan | beden | 0 | -2.2 | "Patient side first" |
| team | beden | 1 | 0 | Dağınık |
| closing | beyin | 0 | 1.75 | Hero'ya geri döner |

**Pozların kaydırmaya bağlanması:**
- Her karede bölümlerin, ekranın ortasına geldikleri kaydırma konumları anahtar kare olarak hesaplanır.
- Kaydırma iki anahtar kare arasındaysa iki poz harmanlanır (`blend`):
  - Konum, dönüş ve şekil ağırlıkları `smoothstep` ile geçer.
  - Dağılma, dağılırken `t³` (yavaş başlar), toplanırken `1-(1-t)³` (hızlı biter) ile geçer. "Önce dönsün, sonra yavaş yavaş dağılsın" isteği buradan geliyor.
- Hesaplanan poz bir **hedeftir**. Sahne her karede hedefe %6 yaklaşır (`k = 0.06`), bu yüzden hareket ağırlıklı ve yumuşak hissettirir.
- Fare, sahneye ayrıca hafif bir eğim verir (y ekseninde ±0.15, x ekseninde ±0.075 radyan).

**HTML katmanları:** Etiketler canvas'a çizilmez; keskin kalsınlar diye HTML öğeleridir. Her karede 3B konumları ekrana izdüşürülür. Üç tür var:
- Beyindeki 8 düğüm etiketi
- Graftaki 7 küme adı
- **Ağrı noktası:** Amber, nabız gibi atan bir halka (`.pain-marker`). Beden şeklindeyken görünür:
  - Hasta bölümünde göbekte durur: "Day 0, 08:00 · pain around the navel".
  - Klinisyen bölümüne geçerken sağ alt karına kayar: "Day 0, 14:00 · pain moves to the lower right". Hastanın sağı, izleyicinin solu olduğu için nokta ekranda sola doğru kayar.
  - Etiketi her zaman bedenin dışında kalır; beden sağdayken etiket sola döner (`.flip`).

**Tema:** `MutationObserver`, `<html data-theme>` değişimini izler. Tema değişince sahne:
- zemin rengini,
- parçacık renklerini (önceden hesaplanmış iki dizi arasında geçerek),
- kenar ve imleç renklerini

anında günceller.

**Mobil (760px altı):**
- Şekil ortalanır. Hero'da başlığın üstüne alınır (`y = 0.85`), başlık ekranın altına iner.
- Diğer bölümlerde metnin arkasında kalacağı için %30 opaklığa iner.
- Etiketler gizlenir, parçacık sayısı düşer.

**"Hareketi azalt" (`prefers-reduced-motion`):**
- Titreşim, dönüş ve imleç efekti kapanır.
- Şekiller dağılmaz, sadece kaydırdıkça soluklaşır.
- Sahne sürekli değil, sadece kaydırma ve tema değişiminde yeniden çizilir.

### 5.3 Tema

- Sayfa çizilmeden önce `<head>` içindeki küçük bir betik (`THEME_SCRIPT`, `app/layout.tsx`) kayıtlı temayı ya da sistem temasını `<html data-theme>` olarak ayarlar. Bu sayede açılışta yanlış temada yanıp sönme olmaz.
- Tema butonu (`ThemeToggle`) seçimi `localStorage` içinde saklar.

## 6. Dosya haritası

| Dosya | İçerik |
|---|---|
| `app/layout.tsx` | Font, tema betiği, meta veriler |
| `app/page.tsx` | Bölümler, metinler, `data-scene` işaretleri, ekip listesi |
| `app/globals.css` | Token'lar, tema, yerleşim ve tüm stiller |
| `app/particle-scene.tsx` | Three.js sahnesi: şekiller, shader, kaydırma koreografisi, etiketler |
| `app/motion.tsx` | Belirme gözlemcisi, ekip karuseli, tema butonu |
| `app/case-demo.tsx` | Etkileşimli apandisit vakası |
| `public/team/` | Ekip fotoğrafları |

## 7. Sık yapılacak değişiklikler

- **Yeni bölüm eklemek:**
  1. `page.tsx` dosyasında bölüme `data-scene="ad"` verin.
  2. `particle-scene.tsx` dosyasında `POSES` içine aynı adla bir poz ekleyin.
  3. Metin soldaysa şekli sağa (`x > 0`), sağdaysa sola koyun.
- **Ekip fotoğrafı eklemek:**
  1. Fotoğrafı 4:5 kırpıp 600×750 yapın ve EXIF verisini silin.
  2. `public/team/ad-soyad.jpg` olarak kaydedin.
  3. `TEAM` dizisinde ilgili kişinin üçüncü alanına yolu yazın.
- **İmleç efektinin gücü:** Shader içinde `near` yarıçapını (0.3), `stir` genliğini ve `near * 0.8` büyüme katsayısını değiştirin.
- **Beynin açısı:** `hero` ve `closing` pozlarındaki `rotY` değeri (0.55) ile `P()` fonksiyonundaki `rotX` varsayılanı (0.15).
- **Graf etiketleri:** `CLUSTERS` ve `LINKS` dizileri. Bunlar şimdilik örnek; gerçek bilgi grafı hazır olunca buradan beslenebilir.
