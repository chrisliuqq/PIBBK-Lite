import { Parser } from './Parser';
import * as cheerio from 'cheerio';

export class SyosetuParser extends Parser {

    public parseNovelName(html: string):string {
        let pattern = /class="margin_r20">(.*?)<\/a>/gsm;
        let match = pattern.exec(html);
        let name;
        if (match && 1 in match) {
            name = match[1];
        }

        return name;
    }

    public parseChapterTitle(html: string):string {
        let pattern = /<p class="novel_subtitle">(.*?)<\/p>/gsm;
        let match = pattern.exec(html);
        let title;
        if (match && 1 in match) {
            title = match[1];
        } else {
            pattern = /<p class="chapter_title">(.*?)<\/p>/gsm;
            match = pattern.exec(html);
            if (match && 1 in match) {
                title = match[1];
            }
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
        $('#novel_honbun p').each(function(this: CheerioElement, data) {
            content += $(this).text() + '\n';
        });

        let re = new RegExp('^　', 'g');
        content = content.replace(re, '');

        return content;
    }
}