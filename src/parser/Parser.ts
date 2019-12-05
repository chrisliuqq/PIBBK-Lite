export abstract class Parser {

    public abstract parseNovelName(url: string): string;

    public abstract parseChapterTitle(url: string): string;

    public abstract parseContent(url: string): string;

    public async downloadHtml(url:string, encoding:string = 'UTF-8'): Promise<string> {

        document.cookie = 'over18=yes';
        console.log(document.cookie);
        let res = await fetch(url, {
            credentials: 'include',
            headers: {
                cookie: 'over18=yes'
            },
            mode: 'cors'
        });
        let html = '';

        if (encoding !== 'UTF-8') {
            // let tmp = await res.arrayBuffer();
            // let buffer = Buffer.from(new Uint8Array(tmp));
            // html = iconv.decode(buffer, encoding);
        } else {
            html = await res.text();
        }

        return html;
    }
}