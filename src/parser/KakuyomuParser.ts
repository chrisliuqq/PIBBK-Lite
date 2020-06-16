import { Parser } from './Parser';
import * as cheerio from 'cheerio';

export class KakuyomuParser extends Parser {

    public parseNovelName(html: string):string {
		let pattern = /<p id="contentMain-header-workTitle" class="js-vertical-composition-item">(.*?)<\/p>/gsm;
        let match = pattern.exec(html);
        let name;
        if (match && 1 in match) {
            name = match[1];
        }

        return name;
    }

    public parseChapterTitle(html: string):string {
		let pattern = /<p class="widget-episodeTitle js-vertical-composition-item">(.*?)<\/p>/gsm;
        let match = pattern.exec(html);
        let title;
        if (match && 1 in match) {
            title = match[1];
        }

        return title;
    }

    public parseContent(html: string):string {
        const $ = cheerio.load(html, {
            normalizeWhitespace: true,
            xmlMode: false,
            decodeEntities: false
        });
        let content = '';
		let i = 1;
		while ($('#p'+i.toString()).length > 0){
			 content += $('#p'+i.toString()).text() + '\n';
			 i += 1;
		}

        let re = new RegExp('^　', 'g');
        content = content.replace(re, '');

        return content;
    }
}