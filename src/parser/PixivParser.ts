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
        // console.log(['parseChapterTitle', match, html]);
        if (match && 1 in match) {
            title = match[1];
        }

        return title;
    }

    public parseContent(html: string):string {
        let pattern = /<meta name="preload-data" id="meta-preload-data" content='(.*?)'/gsm;
        let match = pattern.exec(html);
        let json, chapterId;
        if (match && 1 in match) {
            json = JSON.parse(match[1]);
        }
        pattern = /<link rel="canonical" href="https:\/\/www.pixiv.net\/novel\/show.php\?id=(.*?)">/gsm;
        match = pattern.exec(html);
        if (match && 1 in match) {
            chapterId = match[1];
        }

        return json.novel[chapterId].content;
    }
}