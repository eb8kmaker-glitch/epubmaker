import json, os

os.chdir(os.path.join(os.path.dirname(__file__), '..', 'messages'))

en_faq = {
    "q1": "What file formats can I upload?",
    "a1": "EPUBMaker supports DOCX (Word), TXT, PDF, HTML, and Markdown (.md) files. All are converted to standard EPUB 3 or EPUB 2.",
    "q2": "Do I need an account to convert files?",
    "a2": "No. Basic conversion works without any account. Create a free account if you want to save your conversion history.",
    "q3": "Is there a file size limit?",
    "a3": "Files must be 50 MB or smaller. Cover images must be 10 MB or smaller. Most manuscripts are well within these limits.",
    "q4": "Which EPUB version should I choose?",
    "a4": "EPUB 3 is recommended — it supports rich media, better typography, and modern reading apps. Use EPUB 2 only for older devices.",
    "q5": "Why doesn't my table of contents appear?",
    "a5": "For DOCX files, the TOC is generated from Heading styles. Make sure your document uses Word's built-in heading styles, not manually bolded text.",
    "q6": "What cover image dimensions work best?",
    "a6": "Amazon Kindle recommends 2,560 x 1,600 px. Apple Books recommends 1,400 x 2,100 px. A safe universal size is 1,600 x 2,400 px.",
    "q7": "Can I edit the table of contents after conversion?",
    "a7": "Yes. After conversion, use the built-in TOC Editor to reorder, rename, indent, or delete chapters before downloading.",
    "q8": "Is EPUBMaker free forever?",
    "a8": "Yes. EPUBMaker is a free tool with no conversion limits, supported by non-intrusive advertising.",
    "count": "8"
}

additions = {
    "en": {
        "Navbar": {"convert": "Convert", "blog": "Library", "faq": "FAQ"},
        "Blog": {"title": "The EPUB Library", "subtitle": "Articles, guides, and tips for digital publishing.", "readMore": "Read article", "minRead": "{min} min read", "noArticles": "No articles found.", "backToBlog": "Back to library", "relatedArticles": "Related articles", "tableOfContents": "Contents", "postedOn": "Published"},
        "FAQ": {"title": "Frequently Asked Questions", "subtitle": "Everything about EPUBMaker and digital publishing.", **en_faq},
        "Guides": {"title": "Guides", "subtitle": "Step-by-step guides for creating professional EPUBs.", "comingSoon": "More guides coming soon.", "readGuide": "Read guide", "backToGuides": "Back to guides"},
        "LanguageSwitcher": {"ariaLabel": "Select language"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    },
    "ko": {
        "Navbar": {"convert": "변환하기", "blog": "라이브러리", "faq": "FAQ"},
        "Blog": {"title": "EPUB 라이브러리", "subtitle": "디지털 출판을 위한 아티클, 가이드, 팁.", "readMore": "아티클 읽기", "minRead": "{min}분 읽기", "noArticles": "아티클이 없습니다.", "backToBlog": "라이브러리로 돌아가기", "relatedArticles": "관련 아티클", "tableOfContents": "목차", "postedOn": "게시일"},
        "FAQ": {"title": "자주 묻는 질문", "subtitle": "EPUBMaker와 디지털 출판에 관한 모든 것.", "q1": "어떤 파일 형식을 업로드할 수 있나요?", "a1": "EPUBMaker는 DOCX(Word), TXT, PDF, HTML, Markdown(.md) 파일을 지원합니다. 모두 표준 EPUB 3 또는 EPUB 2로 변환됩니다.", "q2": "파일 변환에 계정이 필요한가요?", "a2": "아니요. 기본 변환은 계정 없이 가능합니다. 변환 기록을 저장하려면 무료 계정을 만드세요.", "q3": "파일 크기 제한이 있나요?", "a3": "파일은 50MB 이하, 표지 이미지는 10MB 이하여야 합니다.", "q4": "어떤 EPUB 버전을 선택해야 하나요?", "a4": "대부분의 경우 EPUB 3을 권장합니다. 구형 기기를 대상으로 할 때만 EPUB 2를 사용하세요.", "q5": "목차가 표시되지 않는 이유는?", "a5": "DOCX 파일의 목차는 제목 스타일에서 생성됩니다. Word의 내장 제목 스타일을 사용해야 합니다.", "q6": "표지 이미지 크기는 어떻게 해야 하나요?", "a6": "Amazon Kindle은 2,560x1,600px, Apple Books는 1,400x2,100px을 권장합니다. 범용 안전 크기는 1,600x2,400px입니다.", "q7": "변환 후 목차를 편집할 수 있나요?", "a7": "네. 변환 후 내장 목차 편집기로 챕터를 재정렬, 이름 변경, 들여쓰기, 삭제할 수 있습니다.", "q8": "EPUBMaker는 영원히 무료인가요?", "a8": "네. EPUBMaker는 변환 횟수 제한 없는 무료 도구입니다.", "count": "8"},
        "Guides": {"title": "가이드", "subtitle": "전문적인 EPUB 제작을 위한 단계별 가이드.", "comingSoon": "더 많은 가이드가 곧 추가됩니다.", "readGuide": "가이드 읽기", "backToGuides": "가이드 목록으로"},
        "LanguageSwitcher": {"ariaLabel": "언어 선택"},
        "FileUpload": {"ariaUpload": "DOCX, TXT, PDF, HTML 또는 MD 파일 업로드", "chooseFile": "파일 선택"}
    },
    "es": {
        "Navbar": {"convert": "Convertir", "blog": "Biblioteca", "faq": "FAQ"},
        "Blog": {"title": "Biblioteca EPUB", "subtitle": "Articulos, guias y consejos para publicacion digital.", "readMore": "Leer articulo", "minRead": "{min} min de lectura", "noArticles": "No hay articulos.", "backToBlog": "Volver a la biblioteca", "relatedArticles": "Articulos relacionados", "tableOfContents": "Contenido", "postedOn": "Publicado"},
        "FAQ": {"title": "Preguntas frecuentes", "subtitle": "Todo sobre EPUBMaker y la publicacion digital.", **en_faq},
        "Guides": {"title": "Guias", "subtitle": "Guias paso a paso para crear EPUBs profesionales.", "comingSoon": "Mas guias proximamente.", "readGuide": "Leer guia", "backToGuides": "Volver a guias"},
        "LanguageSwitcher": {"ariaLabel": "Seleccionar idioma"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    },
    "ja": {
        "Navbar": {"convert": "変換する", "blog": "ライブラリ", "faq": "FAQ"},
        "Blog": {"title": "EPUBライブラリ", "subtitle": "デジタル出版のための記事・ガイド・ヒント", "readMore": "記事を読む", "minRead": "{min}分で読める", "noArticles": "記事がありません。", "backToBlog": "ライブラリに戻る", "relatedArticles": "関連記事", "tableOfContents": "目次", "postedOn": "公開日"},
        "FAQ": {"title": "よくある質問", "subtitle": "EPUBMakerとデジタル出版に関するすべて", **en_faq},
        "Guides": {"title": "ガイド", "subtitle": "プロレベルのEPUB作成のためのステップバイステップガイド", "comingSoon": "近日公開予定のガイドがあります。", "readGuide": "ガイドを読む", "backToGuides": "ガイドに戻る"},
        "LanguageSwitcher": {"ariaLabel": "言語を選択"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    },
    "zh": {
        "Navbar": {"convert": "转换", "blog": "图书馆", "faq": "FAQ"},
        "Blog": {"title": "EPUB图书馆", "subtitle": "数字出版的文章、指南和技巧", "readMore": "阅读文章", "minRead": "{min}分钟阅读", "noArticles": "暂无文章。", "backToBlog": "返回图书馆", "relatedArticles": "相关文章", "tableOfContents": "目录", "postedOn": "发布日期"},
        "FAQ": {"title": "常见问题", "subtitle": "关于EPUBMaker和数字出版的一切", **en_faq},
        "Guides": {"title": "指南", "subtitle": "创建专业EPUB的分步指南", "comingSoon": "更多指南即将推出。", "readGuide": "阅读指南", "backToGuides": "返回指南"},
        "LanguageSwitcher": {"ariaLabel": "选择语言"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    },
    "pt": {
        "Navbar": {"convert": "Converter", "blog": "Biblioteca", "faq": "FAQ"},
        "Blog": {"title": "Biblioteca EPUB", "subtitle": "Artigos, guias e dicas para publicacao digital.", "readMore": "Ler artigo", "minRead": "{min} min de leitura", "noArticles": "Nenhum artigo encontrado.", "backToBlog": "Voltar a biblioteca", "relatedArticles": "Artigos relacionados", "tableOfContents": "Conteudo", "postedOn": "Publicado em"},
        "FAQ": {"title": "Perguntas frequentes", "subtitle": "Tudo sobre o EPUBMaker e publicacao digital.", **en_faq},
        "Guides": {"title": "Guias", "subtitle": "Guias passo a passo para criar EPUBs profissionais.", "comingSoon": "Mais guias em breve.", "readGuide": "Ler guia", "backToGuides": "Voltar aos guias"},
        "LanguageSwitcher": {"ariaLabel": "Selecionar idioma"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    },
    "de": {
        "Navbar": {"convert": "Konvertieren", "blog": "Bibliothek", "faq": "FAQ"},
        "Blog": {"title": "Die EPUB-Bibliothek", "subtitle": "Artikel, Anleitungen und Tipps fur digitales Publizieren.", "readMore": "Artikel lesen", "minRead": "{min} Min. Lesezeit", "noArticles": "Keine Artikel gefunden.", "backToBlog": "Zuruck zur Bibliothek", "relatedArticles": "Verwandte Artikel", "tableOfContents": "Inhalt", "postedOn": "Veroffentlicht"},
        "FAQ": {"title": "Haufige Fragen", "subtitle": "Alles uber EPUBMaker und digitales Publizieren.", **en_faq},
        "Guides": {"title": "Anleitungen", "subtitle": "Schritt-fur-Schritt-Anleitungen fur professionelle EPUBs.", "comingSoon": "Weitere Anleitungen folgen.", "readGuide": "Anleitung lesen", "backToGuides": "Zuruck zu Anleitungen"},
        "LanguageSwitcher": {"ariaLabel": "Sprache auswahlen"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    },
    "fr": {
        "Navbar": {"convert": "Convertir", "blog": "Bibliotheque", "faq": "FAQ"},
        "Blog": {"title": "La bibliotheque EPUB", "subtitle": "Articles, guides et conseils pour la publication numerique.", "readMore": "Lire l'article", "minRead": "{min} min de lecture", "noArticles": "Aucun article trouve.", "backToBlog": "Retour a la bibliotheque", "relatedArticles": "Articles connexes", "tableOfContents": "Sommaire", "postedOn": "Publie le"},
        "FAQ": {"title": "Foire aux questions", "subtitle": "Tout sur EPUBMaker et la publication numerique.", **en_faq},
        "Guides": {"title": "Guides", "subtitle": "Guides etape par etape pour creer des EPUBs professionnels.", "comingSoon": "Plus de guides a venir.", "readGuide": "Lire le guide", "backToGuides": "Retour aux guides"},
        "LanguageSwitcher": {"ariaLabel": "Selectionner la langue"},
        "FileUpload": {"ariaUpload": "Upload DOCX, TXT, PDF, HTML, or MD file", "chooseFile": "Choose file"}
    }
}

for locale, new_keys in additions.items():
    path = f"{locale}.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for namespace, keys in new_keys.items():
        if namespace not in data:
            data[namespace] = {}
        data[namespace].update(keys)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {path}")
