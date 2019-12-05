<template>
    <div id="modal-replace-edit" class="modal-mask">
        <div class="modal">
            <div class="modal-title">名詞取代編輯</div>
            <div class="modal-body">
                <div class="replace-edit-box">
                    <div class="form-inline">
                        <label>要取代的日文：</label>
                        <input type="text" class="form-input flex-grow" v-model="replace.pattern" placeholder="要取代的日文" />
                    </div>
                    <div class="form-inline">
                        <label>取代之後的中文</label>
                        <input type="text" class="form-input flex-grow" v-model="replace.replace" placeholder="取代之後的中文" />
                    </div>
                    <div class="form-inline">
                        <label>此名詞的註解：</label>
                        <input type="text" class="form-input flex-grow" v-model="replace.note" placeholder="此名詞的註解" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="button" @click="$emit('close', 'modal-replace-edit')">關閉</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: ['replace'],
    data() {
        return {};
    },
    methods: {
    },
    computed: {
    }
}
</script>