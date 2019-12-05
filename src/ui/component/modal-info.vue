<template>
    <div id="modal-info" class="modal-mask" style="display: none">
        <div class="modal">
            <div class="modal-title">話數資訊</div>
            <div class="modal-body">
                <div class="replace-edit-box">
                    <div class="form-inline">
                        <label>小說原文網址：</label>
                        <input type="text" class="form-input flex-grow" v-model="info.sourceUrl" placeholder="小說原文網址" />
                    </div>
                    <div class="form-inline">
                        <label>小說名稱原文：</label>
                        <input type="text" class="form-input flex-grow" v-model="info.novelName.source" placeholder="小說名稱原文" />
                    </div>
                    <div class="form-inline">
                        <label>小說名稱翻譯：</label>
                        <input type="text" class="form-input flex-grow" v-model="info.novelName.translation" placeholder="小說名稱翻譯" />
                    </div>
                    <div class="form-inline">
                        <label>話數標題原文：</label>
                        <input type="text" class="form-input flex-grow" v-model="info.chapterTitle.source" placeholder="話數標題原文" />
                    </div>
                    <div class="form-inline">
                        <label>話數標題翻譯：</label>
                        <input type="text" class="form-input flex-grow" v-model="info.chapterTitle.translation" placeholder="話數標題翻譯" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="button" @click="$emit('close', 'modal-info')">關閉</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: ['info'],
    data() {
        return {};
    },
    methods: {
    },
    computed: {
    }
}
</script>