<template>
    <div id="modal-replace" class="modal-mask" style="display: none">
        <div class="modal">
            <div class="modal-title">名詞取代</div>
            <div class="modal-body">
                <div class="flex justify-content-center">
                    <div class="form-inline flex-force-row justify-content-center">
                        <label>儲存取代的位置：</label>
                        <label><input type="radio" name="replaceSourceType" value="local" v-model="replace_source.type" />檔案內部</label>
                        <label><input type="radio" name="replaceSourceType" value="external" v-model="replace_source.type" />外連檔案</label>
                    </div>
                    <div class="form-inline flex-force-row justify-content-center" v-show="replace_source.type === 'external'">
                        <label><button type="button" class="button" @click="showSelectReplaceFileDialog">選取外部檔案</button></label>
                        <p v-html="replace_source.path"></p>
                    </div>
                </div>
                <div class="flex justify-content-center">
                    <div class="form-inline flex-force-row justify-content-center">
                        <label>關鍵字搜尋：</label>
                        <label><input type="text" class="form-input" v-model="keyword" /></label>
                    </div>
                </div>
                <ul class="flex replace-list">
                    <li v-for="(replace, index) in replaceList">
                        <div class="form-inline no-margin-bottom justify-content-center align-items-center">
                            <input type="text" class="form-input" v-model="replace.pattern" placeholder="要取代的日文" />
                            <p class="input-text">
                                <svg class="octicon octicon-arrow-right" viewBox="0 0 10 16" version="1.1" width="10" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M10 8L4 3v3H0v4h4v3l6-5z"></path></svg>
                            </p>
                            <input type="text" class="form-input" v-model="replace.replace" placeholder="取代之後的中文" />
                            <p class="input-text pointer" @click="$emit('edit', replace)">
                                <svg class="octicon octicon-pencil" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M0 12v3h3l8-8-3-3-8 8zm3 2H1v-2h1v1h1v1zm10.3-9.3L12 6 9 3l1.3-1.3a.996.996 0 011.41 0l1.59 1.59c.39.39.39 1.02 0 1.41z"></path></svg>
                            </p>
                            <p class="input-text pointer" @click="deleteReplace(index)">
                                <svg width="12" height="16" viewBox="0 0 12 16" class="octicon octicon-x" aria-label="Close" role="img"><path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z" /></svg>
                            </p>
                        </div>
                        <p class="replace-note">{{ replace.note }}</p>
                    </li>
                    <li><button type="button" class="button" @click="addReplace">新增</button></li>
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="button" @click="cleanDuplicated">過濾重複名詞</button>
                <button type="button" class="button" @click="$emit('input', value);$emit('close', 'modal-replace');modalClose();">關閉</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: ['value', 'replace_source'],
    data() {
        return {keyword: ''};
    },
    methods: {
        addReplace() {
            (this as any).value.push({
                pattern: '',
                replace: '',
                type: 'other',
                note: ''
            });
        },
        cleanDuplicated() {
            let _this = this as any;
            let list = [];
            let newReplaces = [];
            _this.value.forEach((r) => {
                if (!list.includes(r.pattern)) {
                    list.push(r.pattern);
                    newReplaces.push(r);
                }
            });

            newReplaces.sort(function(a, b) {
                let LenA = a.pattern.length;
                let LenB = b.pattern.length;
                if (LenA < LenB) {
                    return 1;
                }
                if (LenA > LenB) {
                    return -1;
                }
                if (a.pattern < b.pattern) {
                    return 1;
                }
                if (a.pattern > b.pattern) {
                    return -1;
                }
                return 0;
            });

            _this.value = newReplaces;
        },
        deleteReplace(index) {
            (this as any).value.splice(index, 1);
        },
        showSelectReplaceFileDialog() {
            (this as any).$emit('update');
        },
        modalClose() {
            (this as any).keyword = '';
        }
    },
    computed: {
        replaceList() {
            let _this = this as any;

            if (_this.keyword.length <= 0) {
                return _this.value;
            }

            let keyword = _this.keyword;

            return _this.value.filter(function(replace) {
                return (replace.pattern.indexOf(keyword) > -1 || replace.replace.indexOf(keyword) > -1 || replace.note.indexOf(keyword) > -1);
            });
        }
    }
}
</script>