import { DataSource } from 'typeorm';

export async function seedZone(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.query(`SELECT COUNT(*) as count FROM provinces`);
//   if (parseInt(existing[0].count) > 0) {
//     console.log('⏭️  Provinces already seeded, skipping...');
//     return;
//   }
  
  // ── 2. RÉGIONS ──────────────────────────────────────────────────────────────
  await dataSource.query(`
    INSERT INTO regions (name, provinceId) VALUES
      -- Antananarivo
      ('Analamanga',          (SELECT id FROM provinces WHERE name = 'Antananarivo')),
      ('Vakinankaratra',      (SELECT id FROM provinces WHERE name = 'Antananarivo')),
      ('Itasy',               (SELECT id FROM provinces WHERE name = 'Antananarivo')),
      ('Bongolava',           (SELECT id FROM provinces WHERE name = 'Antananarivo')),
      -- Fianarantsoa
      ('Haute Matsiatra',     (SELECT id FROM provinces WHERE name = 'Fianarantsoa')),
      ('Amoron''i Mania',     (SELECT id FROM provinces WHERE name = 'Fianarantsoa')),
      ('Vatovavy Fitovinany', (SELECT id FROM provinces WHERE name = 'Fianarantsoa')),
      ('Ihorombe',            (SELECT id FROM provinces WHERE name = 'Fianarantsoa')),
      ('Atsimo Atsinanana',   (SELECT id FROM provinces WHERE name = 'Fianarantsoa')),
      -- Toamasina
      ('Atsinanana',          (SELECT id FROM provinces WHERE name = 'Toamasina')),
      ('Analanjirofo',        (SELECT id FROM provinces WHERE name = 'Toamasina')),
      ('Alaotra Mangoro',     (SELECT id FROM provinces WHERE name = 'Toamasina')),
      -- Mahajanga
      ('Boeny',               (SELECT id FROM provinces WHERE name = 'Mahajanga')),
      ('Sofia',               (SELECT id FROM provinces WHERE name = 'Mahajanga')),
      ('Betsiboka',           (SELECT id FROM provinces WHERE name = 'Mahajanga')),
      ('Melaky',              (SELECT id FROM provinces WHERE name = 'Mahajanga')),
      -- Toliara
      ('Atsimo Andrefana',    (SELECT id FROM provinces WHERE name = 'Toliara')),
      ('Androy',              (SELECT id FROM provinces WHERE name = 'Toliara')),
      ('Anosy',               (SELECT id FROM provinces WHERE name = 'Toliara')),
      ('Menabe',              (SELECT id FROM provinces WHERE name = 'Toliara')),
      -- Antsiranana
      ('Diana',               (SELECT id FROM provinces WHERE name = 'Antsiranana')),
      ('Sava',                (SELECT id FROM provinces WHERE name = 'Antsiranana'))
  `);
  console.log('✅ Régions seeded');

  // ── 3. DISTRICTS ────────────────────────────────────────────────────────────
  await dataSource.query(`
    INSERT INTO districts (name, regionId) VALUES
      -- Analamanga
      ('Antananarivo Renivohitra',  (SELECT id FROM regions WHERE name = 'Analamanga')),
      ('Antananarivo Avaradrano',   (SELECT id FROM regions WHERE name = 'Analamanga')),
      ('Antananarivo Atsimondrano', (SELECT id FROM regions WHERE name = 'Analamanga')),
      ('Ambohidratrimo',            (SELECT id FROM regions WHERE name = 'Analamanga')),
      ('Ankazobe',                  (SELECT id FROM regions WHERE name = 'Analamanga')),
      ('Manjakandriana',            (SELECT id FROM regions WHERE name = 'Analamanga')),
      -- Vakinankaratra
      ('Antsirabe I',               (SELECT id FROM regions WHERE name = 'Vakinankaratra')),
      ('Antsirabe II',              (SELECT id FROM regions WHERE name = 'Vakinankaratra')),
      ('Antanifotsy',               (SELECT id FROM regions WHERE name = 'Vakinankaratra')),
      ('Betafo',                    (SELECT id FROM regions WHERE name = 'Vakinankaratra')),
      ('Faratsiho',                 (SELECT id FROM regions WHERE name = 'Vakinankaratra')),
      ('Mandoto',                   (SELECT id FROM regions WHERE name = 'Vakinankaratra')),
      -- Itasy
      ('Arivonimamo',               (SELECT id FROM regions WHERE name = 'Itasy')),
      ('Miarinarivo',               (SELECT id FROM regions WHERE name = 'Itasy')),
      ('Soavinandriana',            (SELECT id FROM regions WHERE name = 'Itasy')),
      -- Bongolava
      ('Tsiroanomandidy',           (SELECT id FROM regions WHERE name = 'Bongolava')),
      ('Fenoarivobe',               (SELECT id FROM regions WHERE name = 'Bongolava')),
      -- Haute Matsiatra
      ('Fianarantsoa I',            (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      ('Fianarantsoa II',           (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      ('Ambohimahasoa',             (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      ('Ikalamavony',               (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      ('Lalangina',                 (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      ('Isandra',                   (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      ('Vohibato',                  (SELECT id FROM regions WHERE name = 'Haute Matsiatra')),
      -- Amoron'i Mania
      ('Ambositra',                 (SELECT id FROM regions WHERE name = 'Amoron''i Mania')),
      ('Ambatofinandrahana',        (SELECT id FROM regions WHERE name = 'Amoron''i Mania')),
      ('Fandriana',                 (SELECT id FROM regions WHERE name = 'Amoron''i Mania')),
      ('Manandriana',               (SELECT id FROM regions WHERE name = 'Amoron''i Mania')),
      -- Vatovavy Fitovinany
      ('Manakara',                  (SELECT id FROM regions WHERE name = 'Vatovavy Fitovinany')),
      ('Ifanadiana',                (SELECT id FROM regions WHERE name = 'Vatovavy Fitovinany')),
      ('Mananjary',                 (SELECT id FROM regions WHERE name = 'Vatovavy Fitovinany')),
      ('Nosy Varika',               (SELECT id FROM regions WHERE name = 'Vatovavy Fitovinany')),
      ('Vohipeno',                  (SELECT id FROM regions WHERE name = 'Vatovavy Fitovinany')),
      ('Ikongo',                    (SELECT id FROM regions WHERE name = 'Vatovavy Fitovinany')),
      -- Ihorombe
      ('Ihosy',                     (SELECT id FROM regions WHERE name = 'Ihorombe')),
      ('Ivohibe',                   (SELECT id FROM regions WHERE name = 'Ihorombe')),
      ('Lalamba',                   (SELECT id FROM regions WHERE name = 'Ihorombe')),
      -- Atsimo Atsinanana
      ('Farafangana',               (SELECT id FROM regions WHERE name = 'Atsimo Atsinanana')),
      ('Befotaka',                  (SELECT id FROM regions WHERE name = 'Atsimo Atsinanana')),
      ('Midongy Atsimo',            (SELECT id FROM regions WHERE name = 'Atsimo Atsinanana')),
      ('Vangaindrano',              (SELECT id FROM regions WHERE name = 'Atsimo Atsinanana')),
      -- Atsinanana
      ('Toamasina I',               (SELECT id FROM regions WHERE name = 'Atsinanana')),
      ('Toamasina II',              (SELECT id FROM regions WHERE name = 'Atsinanana')),
      ('Brickaville',               (SELECT id FROM regions WHERE name = 'Atsinanana')),
      ('Mahanoro',                  (SELECT id FROM regions WHERE name = 'Atsinanana')),
      ('Marolambo',                 (SELECT id FROM regions WHERE name = 'Atsinanana')),
      ('Vatomandry',                (SELECT id FROM regions WHERE name = 'Atsinanana')),
      -- Analanjirofo
      ('Fenoarivo Atsinanana',      (SELECT id FROM regions WHERE name = 'Analanjirofo')),
      ('Mananara Avaratra',         (SELECT id FROM regions WHERE name = 'Analanjirofo')),
      ('Maroantsetra',              (SELECT id FROM regions WHERE name = 'Analanjirofo')),
      ('Nosy Boraha',               (SELECT id FROM regions WHERE name = 'Analanjirofo')),
      ('Soanierana Ivongo',         (SELECT id FROM regions WHERE name = 'Analanjirofo')),
      ('Vavatenina',                (SELECT id FROM regions WHERE name = 'Analanjirofo')),
      -- Alaotra Mangoro
      ('Ambatondrazaka',            (SELECT id FROM regions WHERE name = 'Alaotra Mangoro')),
      ('Amparafaravola',            (SELECT id FROM regions WHERE name = 'Alaotra Mangoro')),
      ('Andilamena',                (SELECT id FROM regions WHERE name = 'Alaotra Mangoro')),
      ('Anosibe An''ala',           (SELECT id FROM regions WHERE name = 'Alaotra Mangoro')),
      ('Moramanga',                 (SELECT id FROM regions WHERE name = 'Alaotra Mangoro')),
      -- Boeny
      ('Mahajanga I',               (SELECT id FROM regions WHERE name = 'Boeny')),
      ('Mahajanga II',              (SELECT id FROM regions WHERE name = 'Boeny')),
      ('Ambato Boeny',              (SELECT id FROM regions WHERE name = 'Boeny')),
      ('Kandreho',                  (SELECT id FROM regions WHERE name = 'Boeny')),
      ('Marovoay',                  (SELECT id FROM regions WHERE name = 'Boeny')),
      ('Mitsinjo',                  (SELECT id FROM regions WHERE name = 'Boeny')),
      ('Soalala',                   (SELECT id FROM regions WHERE name = 'Boeny')),
      -- Sofia
      ('Analalava',                 (SELECT id FROM regions WHERE name = 'Sofia')),
      ('Antsohihy',                 (SELECT id FROM regions WHERE name = 'Sofia')),
      ('Befandriana Avaratra',      (SELECT id FROM regions WHERE name = 'Sofia')),
      ('Boriziny',                  (SELECT id FROM regions WHERE name = 'Sofia')),
      ('Mampikony',                 (SELECT id FROM regions WHERE name = 'Sofia')),
      ('Mandritsara',               (SELECT id FROM regions WHERE name = 'Sofia')),
      -- Betsiboka
      ('Maevatanana',               (SELECT id FROM regions WHERE name = 'Betsiboka')),
      ('Tsaratanana',               (SELECT id FROM regions WHERE name = 'Betsiboka')),
      ('Kandreho Betsiboka',        (SELECT id FROM regions WHERE name = 'Betsiboka')),
      -- Melaky
      ('Ambatomainty',              (SELECT id FROM regions WHERE name = 'Melaky')),
      ('Antsalova',                 (SELECT id FROM regions WHERE name = 'Melaky')),
      ('Besalampy',                 (SELECT id FROM regions WHERE name = 'Melaky')),
      ('Maintirano',                (SELECT id FROM regions WHERE name = 'Melaky')),
      ('Morafenobe',                (SELECT id FROM regions WHERE name = 'Melaky')),
      -- Atsimo Andrefana
      ('Toliara I',                 (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Toliara II',                (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Ampanihy',                  (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Ankazoabo',                 (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Benenitra',                 (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Beroroha',                  (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Betioky',                   (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Morombe',                   (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      ('Sakaraha',                  (SELECT id FROM regions WHERE name = 'Atsimo Andrefana')),
      -- Androy
      ('Ambovombe',                 (SELECT id FROM regions WHERE name = 'Androy')),
      ('Bekily',                    (SELECT id FROM regions WHERE name = 'Androy')),
      ('Beloha',                    (SELECT id FROM regions WHERE name = 'Androy')),
      ('Tsihombe',                  (SELECT id FROM regions WHERE name = 'Androy')),
      -- Anosy
      ('Taolagnaro',                (SELECT id FROM regions WHERE name = 'Anosy')),
      ('Amboasary',                 (SELECT id FROM regions WHERE name = 'Anosy')),
      ('Betroka',                   (SELECT id FROM regions WHERE name = 'Anosy')),
      -- Menabe
      ('Morondava',                 (SELECT id FROM regions WHERE name = 'Menabe')),
      ('Belo sur Tsiribihina',      (SELECT id FROM regions WHERE name = 'Menabe')),
      ('Mahabo',                    (SELECT id FROM regions WHERE name = 'Menabe')),
      ('Manja',                     (SELECT id FROM regions WHERE name = 'Menabe')),
      ('Miandrivazo',               (SELECT id FROM regions WHERE name = 'Menabe')),
      -- Diana
      ('Antsiranana I',             (SELECT id FROM regions WHERE name = 'Diana')),
      ('Antsiranana II',            (SELECT id FROM regions WHERE name = 'Diana')),
      ('Ambanja',                   (SELECT id FROM regions WHERE name = 'Diana')),
      ('Ambilobe',                  (SELECT id FROM regions WHERE name = 'Diana')),
      ('Nosy Be',                   (SELECT id FROM regions WHERE name = 'Diana')),
      -- Sava
      ('Andapa',                    (SELECT id FROM regions WHERE name = 'Sava')),
      ('Antalaha',                  (SELECT id FROM regions WHERE name = 'Sava')),
      ('Sambava',                   (SELECT id FROM regions WHERE name = 'Sava')),
      ('Vohemar',                   (SELECT id FROM regions WHERE name = 'Sava'))
  `);
  console.log('✅ Districts seeded');

  // ── 4. COMMUNES ─────────────────────────────────────────────────────────────
  await dataSource.query(`
    INSERT INTO communes (name, district_id) VALUES
      -- Antananarivo Renivohitra
      ('Antananarivo Renivohitra',  (SELECT id FROM districts WHERE name = 'Antananarivo Renivohitra')),
      -- Antananarivo Avaradrano
      ('Ambohimangakely',           (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Ambohimanambola',           (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Ambohimiadana',             (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Ambohitrimanjaka',          (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Ankadikely Ilafy',          (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Sabotsy Namehana',          (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Masindray',                 (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      ('Manandriana Avaradrano',    (SELECT id FROM districts WHERE name = 'Antananarivo Avaradrano')),
      -- Antananarivo Atsimondrano
      ('Ambohidrapeto',             (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Ambohijanaka',              (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Ampahitrosy',               (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Andranonahoatra',           (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Anosizato',                 (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Fenoarivo Atsimondrano',    (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Itaosy',                    (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Ivato',                     (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Soalandy',                  (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Tanjombato',                (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Bemasoandro',               (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      ('Alakamisy Fenoarivo',       (SELECT id FROM districts WHERE name = 'Antananarivo Atsimondrano')),
      -- Ambohidratrimo
      ('Ambohidratrimo',            (SELECT id FROM districts WHERE name = 'Ambohidratrimo')),
      ('Ambohipihaonana',           (SELECT id FROM districts WHERE name = 'Ambohidratrimo')),
      ('Anosiala',                  (SELECT id FROM districts WHERE name = 'Ambohidratrimo')),
      ('Fieferana',                 (SELECT id FROM districts WHERE name = 'Ambohidratrimo')),
      ('Mahabo Mananivo',           (SELECT id FROM districts WHERE name = 'Ambohidratrimo')),
      ('Andranovelona',             (SELECT id FROM districts WHERE name = 'Ambohidratrimo')),
      -- Ankazobe
      ('Ankazobe',                  (SELECT id FROM districts WHERE name = 'Ankazobe')),
      ('Kiangara',                  (SELECT id FROM districts WHERE name = 'Ankazobe')),
      ('Mahavelona Ankazobe',       (SELECT id FROM districts WHERE name = 'Ankazobe')),
      ('Fihaonana',                 (SELECT id FROM districts WHERE name = 'Ankazobe')),
      -- Manjakandriana
      ('Manjakandriana',            (SELECT id FROM districts WHERE name = 'Manjakandriana')),
      ('Ambatomanga',               (SELECT id FROM districts WHERE name = 'Manjakandriana')),
      ('Andreba',                   (SELECT id FROM districts WHERE name = 'Manjakandriana')),
      ('Ranovao',                   (SELECT id FROM districts WHERE name = 'Manjakandriana')),
      -- Antsirabe I
      ('Antsirabe I',               (SELECT id FROM districts WHERE name = 'Antsirabe I')),
      -- Antsirabe II
      ('Antsirabe II',              (SELECT id FROM districts WHERE name = 'Antsirabe II')),
      ('Ambohimandroso',            (SELECT id FROM districts WHERE name = 'Antsirabe II')),
      ('Andranomanelatra',          (SELECT id FROM districts WHERE name = 'Antsirabe II')),
      ('Antanambao Antsirabe',      (SELECT id FROM districts WHERE name = 'Antsirabe II')),
      ('Vinaninony',                (SELECT id FROM districts WHERE name = 'Antsirabe II')),
      -- Antanifotsy
      ('Antanifotsy',               (SELECT id FROM districts WHERE name = 'Antanifotsy')),
      ('Ambatolampy',               (SELECT id FROM districts WHERE name = 'Antanifotsy')),
      ('Ambatonikolahy',            (SELECT id FROM districts WHERE name = 'Antanifotsy')),
      -- Betafo
      ('Betafo',                    (SELECT id FROM districts WHERE name = 'Betafo')),
      ('Alarobia Betafo',           (SELECT id FROM districts WHERE name = 'Betafo')),
      ('Ramainandro',               (SELECT id FROM districts WHERE name = 'Betafo')),
      -- Arivonimamo
      ('Arivonimamo I',             (SELECT id FROM districts WHERE name = 'Arivonimamo')),
      ('Arivonimamo II',            (SELECT id FROM districts WHERE name = 'Arivonimamo')),
      ('Miantso',                   (SELECT id FROM districts WHERE name = 'Arivonimamo')),
      -- Miarinarivo
      ('Miarinarivo I',             (SELECT id FROM districts WHERE name = 'Miarinarivo')),
      ('Miarinarivo II',            (SELECT id FROM districts WHERE name = 'Miarinarivo')),
      -- Tsiroanomandidy
      ('Tsiroanomandidy',           (SELECT id FROM districts WHERE name = 'Tsiroanomandidy')),
      ('Bemahatazana',              (SELECT id FROM districts WHERE name = 'Tsiroanomandidy')),
      -- Fianarantsoa I
      ('Fianarantsoa I',            (SELECT id FROM districts WHERE name = 'Fianarantsoa I')),
      -- Fianarantsoa II
      ('Fianarantsoa II',           (SELECT id FROM districts WHERE name = 'Fianarantsoa II')),
      ('Alakamisy Ambohimaha',      (SELECT id FROM districts WHERE name = 'Fianarantsoa II')),
      ('Ambalavao',                 (SELECT id FROM districts WHERE name = 'Fianarantsoa II')),
      -- Ambohimahasoa
      ('Ambohimahasoa',             (SELECT id FROM districts WHERE name = 'Ambohimahasoa')),
      ('Amborompotsy',              (SELECT id FROM districts WHERE name = 'Ambohimahasoa')),
      -- Ambositra
      ('Ambositra I',               (SELECT id FROM districts WHERE name = 'Ambositra')),
      ('Ambositra II',              (SELECT id FROM districts WHERE name = 'Ambositra')),
      ('Ambatomarina',              (SELECT id FROM districts WHERE name = 'Ambositra')),
      -- Fandriana
      ('Fandriana',                 (SELECT id FROM districts WHERE name = 'Fandriana')),
      ('Alakamisy Itenina',         (SELECT id FROM districts WHERE name = 'Fandriana')),
      -- Manakara
      ('Manakara Atsimo',           (SELECT id FROM districts WHERE name = 'Manakara')),
      ('Bekatra',                   (SELECT id FROM districts WHERE name = 'Manakara')),
      ('Vohimasina',                (SELECT id FROM districts WHERE name = 'Manakara')),
      -- Mananjary
      ('Mananjary',                 (SELECT id FROM districts WHERE name = 'Mananjary')),
      ('Ambohinihaonana',           (SELECT id FROM districts WHERE name = 'Mananjary')),
      -- Vohipeno
      ('Vohipeno',                  (SELECT id FROM districts WHERE name = 'Vohipeno')),
      -- Ihosy
      ('Ihosy',                     (SELECT id FROM districts WHERE name = 'Ihosy')),
      ('Ranohira',                  (SELECT id FROM districts WHERE name = 'Ihosy')),
      -- Farafangana
      ('Farafangana',               (SELECT id FROM districts WHERE name = 'Farafangana')),
      ('Vangaindrano',              (SELECT id FROM districts WHERE name = 'Vangaindrano')),
      -- Toamasina I
      ('Toamasina I',               (SELECT id FROM districts WHERE name = 'Toamasina I')),
      -- Toamasina II
      ('Toamasina II',              (SELECT id FROM districts WHERE name = 'Toamasina II')),
      ('Ambodiriana',               (SELECT id FROM districts WHERE name = 'Toamasina II')),
      ('Foulpointe',                (SELECT id FROM districts WHERE name = 'Toamasina II')),
      -- Brickaville
      ('Brickaville',               (SELECT id FROM districts WHERE name = 'Brickaville')),
      ('Ampasimbe Onibe',           (SELECT id FROM districts WHERE name = 'Brickaville')),
      -- Mahanoro
      ('Mahanoro',                  (SELECT id FROM districts WHERE name = 'Mahanoro')),
      -- Vatomandry
      ('Vatomandry',                (SELECT id FROM districts WHERE name = 'Vatomandry')),
      -- Ambatondrazaka
      ('Ambatondrazaka',            (SELECT id FROM districts WHERE name = 'Ambatondrazaka')),
      ('Amparafaravola',            (SELECT id FROM districts WHERE name = 'Amparafaravola')),
      ('Moramanga',                 (SELECT id FROM districts WHERE name = 'Moramanga')),
      ('Andilamena',                (SELECT id FROM districts WHERE name = 'Andilamena')),
      -- Mahajanga I
      ('Mahajanga I',               (SELECT id FROM districts WHERE name = 'Mahajanga I')),
      -- Mahajanga II
      ('Mahajanga II',              (SELECT id FROM districts WHERE name = 'Mahajanga II')),
      ('Amborovy',                  (SELECT id FROM districts WHERE name = 'Mahajanga II')),
      -- Marovoay
      ('Marovoay I',                (SELECT id FROM districts WHERE name = 'Marovoay')),
      ('Marovoay II',               (SELECT id FROM districts WHERE name = 'Marovoay')),
      -- Antsohihy
      ('Antsohihy',                 (SELECT id FROM districts WHERE name = 'Antsohihy')),
      -- Mandritsara
      ('Mandritsara',               (SELECT id FROM districts WHERE name = 'Mandritsara')),
      -- Befandriana Avaratra
      ('Befandriana Avaratra',      (SELECT id FROM districts WHERE name = 'Befandriana Avaratra')),
      -- Maevatanana
      ('Maevatanana I',             (SELECT id FROM districts WHERE name = 'Maevatanana')),
      ('Maevatanana II',            (SELECT id FROM districts WHERE name = 'Maevatanana')),
      -- Tsaratanana
      ('Tsaratanana',               (SELECT id FROM districts WHERE name = 'Tsaratanana')),
      -- Maintirano
      ('Maintirano',                (SELECT id FROM districts WHERE name = 'Maintirano')),
      -- Toliara I
      ('Toliara I',                 (SELECT id FROM districts WHERE name = 'Toliara I')),
      -- Toliara II
      ('Toliara II',                (SELECT id FROM districts WHERE name = 'Toliara II')),
      ('Ambolobe',                  (SELECT id FROM districts WHERE name = 'Toliara II')),
      ('Belalanda',                 (SELECT id FROM districts WHERE name = 'Toliara II')),
      ('Miary',                     (SELECT id FROM districts WHERE name = 'Toliara II')),
      -- Betioky
      ('Betioky Atsimo',            (SELECT id FROM districts WHERE name = 'Betioky')),
      ('Ejeda',                     (SELECT id FROM districts WHERE name = 'Betioky')),
      -- Ampanihy
      ('Ampanihy Ouest',            (SELECT id FROM districts WHERE name = 'Ampanihy')),
      -- Sakaraha
      ('Sakaraha',                  (SELECT id FROM districts WHERE name = 'Sakaraha')),
      -- Morombe
      ('Morombe',                   (SELECT id FROM districts WHERE name = 'Morombe')),
      -- Ambovombe
      ('Ambovombe',                 (SELECT id FROM districts WHERE name = 'Ambovombe')),
      ('Ambazoa',                   (SELECT id FROM districts WHERE name = 'Ambovombe')),
      -- Bekily
      ('Bekily',                    (SELECT id FROM districts WHERE name = 'Bekily')),
      -- Tsihombe
      ('Tsihombe',                  (SELECT id FROM districts WHERE name = 'Tsihombe')),
      -- Taolagnaro
      ('Taolagnaro',                (SELECT id FROM districts WHERE name = 'Taolagnaro')),
      ('Ranopiso',                  (SELECT id FROM districts WHERE name = 'Taolagnaro')),
      -- Amboasary
      ('Amboasary Atsimo',          (SELECT id FROM districts WHERE name = 'Amboasary')),
      -- Betroka
      ('Betroka',                   (SELECT id FROM districts WHERE name = 'Betroka')),
      -- Morondava
      ('Morondava',                 (SELECT id FROM districts WHERE name = 'Morondava')),
      -- Belo sur Tsiribihina
      ('Belo sur Tsiribihina',      (SELECT id FROM districts WHERE name = 'Belo sur Tsiribihina')),
      -- Miandrivazo
      ('Miandrivazo',               (SELECT id FROM districts WHERE name = 'Miandrivazo')),
      -- Antsiranana I
      ('Antsiranana I',             (SELECT id FROM districts WHERE name = 'Antsiranana I')),
      -- Antsiranana II
      ('Antsiranana II',            (SELECT id FROM districts WHERE name = 'Antsiranana II')),
      ('Ramena',                    (SELECT id FROM districts WHERE name = 'Antsiranana II')),
      -- Ambanja
      ('Ambanja',                   (SELECT id FROM districts WHERE name = 'Ambanja')),
      ('Ambaliha',                  (SELECT id FROM districts WHERE name = 'Ambanja')),
      -- Ambilobe
      ('Ambilobe',                  (SELECT id FROM districts WHERE name = 'Ambilobe')),
      ('Antsohimbondrona',          (SELECT id FROM districts WHERE name = 'Ambilobe')),
      -- Nosy Be
      ('Nosy Be',                   (SELECT id FROM districts WHERE name = 'Nosy Be')),
      -- Sambava
      ('Sambava',                   (SELECT id FROM districts WHERE name = 'Sambava')),
      ('Andasibe Sambava',          (SELECT id FROM districts WHERE name = 'Sambava')),
      -- Antalaha
      ('Antalaha',                  (SELECT id FROM districts WHERE name = 'Antalaha')),
      -- Andapa
      ('Andapa',                    (SELECT id FROM districts WHERE name = 'Andapa')),
      ('Befingotra',                (SELECT id FROM districts WHERE name = 'Andapa')),
      -- Vohemar
      ('Vohemar',                   (SELECT id FROM districts WHERE name = 'Vohemar')),
      ('Daraina',                   (SELECT id FROM districts WHERE name = 'Vohemar'))
  `);
  console.log('✅ Communes seeded');
}