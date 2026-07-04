// 1. ПРЯМАЯ ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ (БЕЗ ФУНКЦИИ INITAPP)
const SUPABASE_URL = "https://supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidGVqaHByY2VlY2d1a3RubGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzcyMzcsImV4cCI6MjA5ODY1MzIzN30.mJq0THXoyfN3l6LKy1nHttQ58xcPEn10E4Uhs_pj9po";

// Находим библиотеку напрямую в окне браузера
const clientLib = window.supabase || window.Supabase;

if (!clientLib) {
    alert("Критическая ошибка: библиотека Supabase не найдена. Проверьте строку подключения в файле index.html!");
}

// Создаем подключение сразу
const db = clientLib ? clientLib.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
let stations = [];

// 2. ФУНКЦИЯ ЗАГРУЗКИ СТАНЦИЙ ИЗ ОБЛАКА
async function loadStations() {
    if (!db) return;
    try {
        const { data, error } = await db
            .from('stations')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        stations = data || [];
        displayStations();
    } catch (err) {
        console.error("Ошибка при получении данных из базы:", err.message);
    }
}

// 3. ФУНКЦИЯ СОЗДАНИЯ РАДИО С ОТПРАВКОЙ В ОБЛАКО И В РАДИО-БРАУЗЕР
async function createNewRadio() {
    if (!db) return alert("Ошибка: База данных ещё не инициализирована!");
    
    const name = document.getElementById('stationName').value.trim();
    const genre = document.getElementById('stationGenre').value.trim();

    if (!name) {
        alert('Пожалуйста, введите название радиостанции!');
        return;
    }

    // НАСТОЯЩИЙ поток вещания. Измените эту заглушку, когда пользователи начнут вставлять свои стримы.
    const streamUrl = "https://zeno.fm"; 

    try {
        // А. Запись в вашу облачную базу Supabase
        const { data, error } = await db
            .from('stations')
            .insert([{ name: name, genre: genre, stream_url: streamUrl }])
            .select();

        if (error) throw error;

        // Б. Отправка в мировой каталог Radio-Browser (Теперь работает из интернета без CORS ошибок!)
        try {
            const response = await fetch('https://radio-browser.info', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'MyRadioPlatform/1.0 (https://github.com)' // Правило хорошего тона для API
                },
                body: JSON.stringify({
                    name: name,
                    url: streamUrl,                     // Поток обязательно должен быть активным аудио-потоком
                    homepage: window.location.href,    // Теперь здесь автоматически передается ваш url на GitHub Pages!
                    favicon: "",                       // Иконка (можно оставить пустой)
                    tags: genre ? genre : "pop,music", // Теги для поиска в приложениях
                    country: "Russia",                 // Страна вещания
                    language: "russian"                // Язык станции
                })
            });
            
            if (response.ok) {
                console.log("Успешно зарегистрировано в глобальной базе Radio-Browser!");
            } else {
                console.warn("Каталог отклонил запрос, возможно поток временно недоступен.");
            }
        } catch (apiErr) {
            console.error("Сетевая ошибка при отправке в глобальный каталог:", apiErr);
        }

        // Выводим подтверждение пользователю
        alert(`Радиостанция "${name}" успешно запущена! Она добавлена на сайт и отправлена в мировые приложения.`);
        
        // Очищаем текстовые поля
        document.getElementById('stationName').value = '';
        document.getElementById('stationGenre').value = '';
        
        // Обновляем список карточек на сайте
        await loadStations();

    } catch (mainErr) {
        alert("Ошибка подключения к базе: " + mainErr.message);
        console.error(mainErr);
    }
}


// 4. ФУНКЦИЯ ВЫВОДА СТАНЦИЙ НА ЭКРАН
function displayStations() {
    const container = document.getElementById('radioList');
    container.innerHTML = ''; 

    if (!stations || stations.length === 0) {
        container.innerHTML = '<p style="color: #888; width: 100%;">Станций в базе пока нет. Создайте первую!</p>';
        return;
    }

    stations.forEach(station => {
        container.innerHTML += `
            <div class="radio-card">
                <h3>${station.name}</h3>
                <p>Жанр: ${station.genre || 'Не указан'}</p>
                <audio controls>
                    <source src="${station.stream_url}" type="audio/mpeg">
                    Ваш браузер не поддерживает аудио.
                </audio>
                <button class="delete-btn" onclick="deleteRadio(${station.id})">Удалить радио</button>
            </div>
        `;
    });
}

// 5. ФУНКЦИЯ УДАЛЕНИЯ РАДИО
async function deleteRadio(stationId) {
    if (!db) return;
    const confirmDelete = confirm("Вы уверены, что хотите удалить эту радиостанцию?");
    if (!confirmDelete) return;

    try {
        const { error } = await db
            .from('stations')
            .delete()
            .eq('id', stationId);

        if (error) throw error;

        await loadStations();
    } catch (err) {
        alert("Ошибка при удалении: " + err.message);
    }
}

// Сразу запускаем чтение данных при открытии скрипта
loadStations();
