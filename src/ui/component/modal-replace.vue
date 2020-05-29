<template>
    <div id="modal-replace" class="modal-mask" style="display: none">
        <div class="modal">
            <div class="modal-title">名詞取代</div>
            <div class="modal-body">
                <ul class="flex replace-list">
                    <li v-for="(replace, index) in value">
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
                <button type="button" class="button" @click="$emit('input', value);$emit('close', 'modal-replace')">關閉</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: ['value'],
    data() {
        return {};
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
                // return b.pattern.length - a.pattern.length;
                if (a.pattern < b.pattern) {
                    return 1;
                }
                if (a.pattern > b.pattern) {
                    return -1;
                }

                // names must be equal
                return 0;
            });

            _this.value = newReplaces;
        },
        deleteReplace(index) {
            (this as any).value.splice(index, 1);
        }
    },
    computed: {
    }
}
</script>