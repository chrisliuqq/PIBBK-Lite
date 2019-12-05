import { Parser } from './Parser';

export class PixivParser extends Parser {

    public parseNovelName(html: string):string {
        // <span itemprop="title">現実主義勇者の王国再建記</span>
        // <title>【現実主義勇者の王国再建記】
        // let pattern = /<span itemprop="title">(.*?)<\/span>/gsm;
        let pattern = /<title>【(.*?)】/gsm;
        let match = pattern.exec(html);
        let name;
        if (match && 1 in match) {
            name = match[1];
        }

        return name;
    }

    public parseChapterTitle(html: string):string {
        // <meta property="twitter:title" content="現国《蒼海疾駆の章》第二十二話『近接戦闘』">
        let pattern = /<meta property="twitter:title" content="(.*?)">/gsm;
        let match = pattern.exec(html);
        let title;
        console.log(['parseChapterTitle', match, html]);
        if (match && 1 in match) {
            title = match[1];
        }

        return title;
    }

    public parseContent(html: string):string {
        let pattern = /novel_text_noscript">(.*?)<\/textarea>/gsm;
        let match = pattern.exec(html);
        let content;
        if (1 in match) {
            content = match[1];
        }

        return content;
    }
}