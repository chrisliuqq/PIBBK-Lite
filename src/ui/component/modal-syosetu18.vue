<template>
    <div id="modal-syosetu-r18-confirm" class="modal-mask" style="display: none">
        <div class="modal">
            <div class="modal-body">
                <webview src="https://novel18.syosetu.com/n0153ce/"></webview>
            </div>
            <div class="modal-footer">
                <button type="button" class="button" @click="$emit('close', 'modal-syosetu-r18-confirm')">關閉</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    data() {
        return {};
    },
    methods: {
    },
    computed: {
    }
}
</script>