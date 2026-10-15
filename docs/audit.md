# Проверка Dentist_eng_commercial

Дата: 16 октября 2026. Исходная версия: `80bcbbd`.

## Исправления

| Область | Исходное поведение | Результат |
| --- | --- | --- |
| Отправка обращения | Локальный клик показывал «Request received» и обещание звонка за 15 минут | Явное локальное демо-превью; никакой ложной отправки |
| Ввод пользователя | Имя/телефон вставлялись в HTML при возврате и показе результата | `.value` / `textContent`, проверено XSS-сценарием |
| Валидация | Проверялись лишь 5 цифр телефона; имя не требовалось | Имя 2–80 символов, телефон 7–15 цифр с допустимыми разделителями, подтверждение демо |
| Черновик | Возврат мог терять введённые значения | Сохранение при возврате и смене темы обращения; очистка при закрытии |
| Модальные окна | Несколько слоёв, собственный focus trap, таймер мог скрыть вновь открытый слой | Один native dialog, версия/отмена таймеров, передача и возврат фокуса |
| Мобильное меню | Собственный слой с неполной изоляцией фона | Нативный dialog и внутренняя кнопка закрытия; закрытие на breakpoint |
| Галерея | Менялся класс, статическая картинка оставалась прежней; изображение вызывало overflow | Реальная смена фото, decode и защита от гонок, адаптивная сетка |
| Сравнение | Pointer и последующий click повторно сдвигали разделитель | Нативный range без дополнительного сдвига; клавиатурные шаги точны |
| Ресурсы | Ссылка на отсутствующий dental-detail.jpg и тяжёлые фото | Исправленная ссылка на WebP; 7 новых WebP-вариантов |
| Темы | Системная смена могла записываться как явный выбор | System preference действует, пока пользователь не выбрал сам |
| Движение | Reduced motion считался лишь при запуске, общей паузы не было | Динамическое предпочтение, пауза, остановка CSS в скрытой вкладке |
| Содержимое | Фиктивные телефон, email, карта, метрики и «LIVE» scan accuracy | Контакты явно не настроены; метрики заменены принципами; иллюстрации обозначены |
| Дизайн | Холодная статичная подача | Новый редакционный hero, арочная фотография, обе темы, параллакс, контуры, seal и transitions |
| Поддержка | Один большой script, без README/тестов/CI | ES-модули, README, архитектура, 25 тестов и GitHub Actions |

## Проверки

- 8 unit-тестов: валидация полей, range, ресурсы.
- 17 браузерных сценариев Chromium: форма, XSS, отсутствие POST, draft lifecycle, фокус/Escape/scroll, повторное открытие во время закрытия, галерея, comparison, FAQ, темы и motion.
- Layout/navigation: 320, 390, 768, 1024 и 1440 px; горизонтального переполнения нет.
- Автоматическая проверка axe WCAG A/AA/2.1 AA в обеих темах и в мобильной форме.
- Проверка без JavaScript: основное содержимое доступно, нет скрывающего его класса `js` до инициализации.
- Ресурсы страницы и JS не дают локальных 404/runtime errors в тестовом проходе.
- Визуальный просмотр через браузер: светлая/тёмная темы, мобильный hero и форма.
- Форматирование Prettier и `git diff --check`.

## Изображения

Соответствующие семь исходных JPEG: 11 441 640 байт. Используемые WebP-варианты: 518 346 байт (на 95,5% меньше). Это сравнение файлов, не синтетический балл и не замер времени загрузки. Оригиналы сохранены; активная страница использует оптимизированные варианты и исходный `dental-detail.webp`.

## Ограничения

Настоящий приём заявок не подключён: нет сервера и проверенных контактов клиники. Это явно обозначено в форме и документации. Формулировки/цены макета не являются клиническим предложением; редакционное сравнение не выдаётся за результаты пациентов.

Микросервисы не добавлены: для текущей статической страницы полезнее модульный frontend. Ручная проверка Safari/Firefox, реальные мобильные устройства и длительные измерения FPS не выполнялись. Автоматический axe не заменяет полную экспертную проверку доступности.

## UI review after the studio redesign

- Replaced the abstract hero slogan with the service category and a shorter headline; reduced the type size and excess vertical space.
- Stacked section headings and descriptions below 700px. The previous two-column layout squeezed mobile descriptions into narrow text strips.
- Made the sticky mobile header opaque in its initial and scrolled states.
- Used sans-serif text for treatment names and descriptions, increased prices and captions, and expanded the mobile consultation action.
- Disclosed the preview-only flow next to the primary action and changed booking labels to planning labels.
- Restored all seven section links at desktop widths of 1280px and above. Kept the compact primary navigation on smaller desktops.
- Added regression checks for mobile introduction layout, opaque header, and desktop navigation overlap.

## Comparison motion and dark-theme palette

- Added matching 160 ms transitions to the image mask and divider. Reduced-motion and pause settings disable both transitions.
- Added keyboard-accessible buttons for each full image and the split view; synchronized selected state with the native range.
- Replaced the leftover teal technology background with warm plum, and updated secondary text and browser theme colors.
- Validation: 8 unit tests and 22 browser tests passed, including comparison controls, reduced motion, theme colors, and accessibility.
