<script setup lang="ts">
import { ref } from 'vue'

export interface Annotation {
  label?: string
  confidence?: number
  annotationType?: string
  annotatorRole?: string
}

interface Props {
  messageId: string
  annotations: Annotation[]
  labelOptions: { label: string, value: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:annotations', messageId: string, value: Annotation[]): void
}>()

const newAnnotations = ref<Annotation[]>([...props.annotations])

onMounted(() => {
  newAnnotations.value.push({
    label: '',
    confidence: 1,
    annotatorRole: 'assistant',
    annotationType: 'intent',
  })
})

function updateAnnotationConfidence() {
  emit('update:annotations', props.messageId, newAnnotations.value)
}

function updateAnnotationCategory() {
  emit('update:annotations', props.messageId, newAnnotations.value)
}
</script>

<template>
  <div class="annotations-simple">
    <div class="annotations-list">
      <div v-for="(annotation, idx) in newAnnotations" :key="idx">
        <!-- AI预测分类 -->
        <div v-if="annotation.annotatorRole === 'bot'" class="annotation-item">
          <el-tag size="small" effect="plain">
            {{ annotation.label }}
          </el-tag>
          <el-input-number
            v-model="annotation.confidence"
            :min="0"
            :max="1"
            :step="0.01"
            :precision="2"
            size="small"
            controls-position="right"
            @change="updateAnnotationConfidence"
          />
        </div>

        <!-- 人工标注 - 只保留一个 -->
        <div v-if="annotation.annotatorRole === 'assistant'" class="annotation-item human-annotation">
          <el-select
            v-model="annotation.label"
            placeholder="选择分类"
            size="small"
            filterable
            @change="updateAnnotationCategory"
          >
            <el-option
              v-for="option in props.labelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input-number
            v-model="annotation.confidence"
            :min="0"
            :max="1"
            :step="0.01"
            :precision="2"
            size="small"
            controls-position="right"
            @change="updateAnnotationConfidence"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.annotations-simple {
  flex-shrink: 0;
  width: 180px;
  padding: 8px;
  background-color: #f9f9f9;
  border: 1px solid #eaeaea;
  border-radius: 8px;
}

.annotations-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.annotation-item {
  display: flex;
  gap: 6px;
  align-items: center;

  .el-tag {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    white-space: nowrap;
  }

  .el-input-number {
    width: 70px;
  }

  .el-select {
    flex: 1;
    max-width: 135px;
  }
}

.human-annotation {
  padding-top: 6px;
  margin-top: 3px;
  border-top: 1px dashed #dcdfe6;
}

:deep(.el-input-number .el-input__wrapper) {
  padding: 0 6px;
}

:deep(.el-select .el-input__wrapper) {
  padding: 0 6px;
}
</style>
